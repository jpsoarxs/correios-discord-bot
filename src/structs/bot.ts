import config from "../config/environment";

import {
  ApplicationCommandDataResolvable,
  ChatInputCommandInteraction,
  Client,
  Collection,
  Events,
  Interaction,
  REST,
  Routes,
  Snowflake,
} from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { Command } from "../interfaces/Command";
import { MissingPermissionsException } from "../utils/MissingPermissionsException";
import { PermissionResult, checkPermissions } from "../utils/checkPermissions";

import connection from "../database/connection";
import clearJob from "../jobs/clear";
import notifyJob from "../jobs/notify";

export class Bot {
  public readonly prefix = config.DISCORD_PREFIX;

  public commands = new Collection<string, Command>();
  public slashCommands = new Array<ApplicationCommandDataResolvable>();
  public slashCommandsMap = new Collection<string, Command>();
  public cooldowns = new Collection<string, Collection<Snowflake, number>>();

  public constructor(public readonly client: Client) {
    connection.once("open", () => {
      console.log("Connected to database!");

      notifyJob.start();
      clearJob.start();

      this.client.login(config.DISCORD_TOKEN);

      this.client.on("ready", () => {
        console.log(`Logged in as ${this.client.user!.username} ready!`);

        this.registerSlashCommands();
      });

      this.client.on("warn", (info) => console.log(info));
      this.client.on("error", (error) => {
        notifyJob.stop();
        clearJob.stop();

        console.error(error);
      });

      this.onInteractionCreate();
    });

    connection.on("error", (err) => {
      notifyJob.stop();
      clearJob.stop();

      console.log("Database connection error: " + err);
    });
  }

  private async registerSlashCommands() {
    const rest = new REST({ version: "9" }).setToken(config.DISCORD_TOKEN);

    const commandFiles = await readdirSync(
      join(__dirname, "..", "commands")
    ).filter((file) => file.endsWith(".ts"));

    for (const file of commandFiles) {
      const command = await import(join(__dirname, "..", "commands", file));

      this.slashCommands.push(command.default.data);
      this.slashCommandsMap.set(command.default.data.name, command.default);
    }

    await rest.put(Routes.applicationCommands(this.client.user!.id), {
      body: this.slashCommands,
    });
  }

  private async onInteractionCreate() {
    this.client.on(
      Events.InteractionCreate,
      async (interaction: Interaction): Promise<any> => {
        if (!interaction.isChatInputCommand()) return;

        const command = this.slashCommandsMap.get(interaction.commandName);

        if (!command) return;

        if (!this.cooldowns.has(interaction.commandName)) {
          this.cooldowns.set(interaction.commandName, new Collection());
        }

        const now = Date.now();
        const timestamps: any = this.cooldowns.get(interaction.commandName);
        const cooldownAmount = (command.cooldown || 1) * 1000;

        if (timestamps.has(interaction.user.id)) {
          const expirationTime =
            timestamps.get(interaction.user.id) + cooldownAmount;

          if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return interaction.reply({
              content:
                "Por favor, espere " +
                timeLeft.toFixed(1) +
                " segundo(s) antes de usar o comando novamente.",
              ephemeral: true,
            });
          }
        }

        timestamps.set(interaction.user.id, now);
        setTimeout(
          () => timestamps.delete(interaction.user.id),
          cooldownAmount
        );

        try {
          const permissionsCheck: PermissionResult = await checkPermissions(
            command,
            interaction
          );

          if (permissionsCheck.result) {
            command.execute(interaction as ChatInputCommandInteraction);
          } else {
            throw new MissingPermissionsException(permissionsCheck.missing);
          }
        } catch (error: any) {
          console.error(error);

          if (error.message.includes("permissions")) {
            interaction
              .reply({ content: error.toString(), ephemeral: true })
              .catch(console.error);
          } else {
            interaction
              .reply({
                content: "Houve um erro ao executar este comando.",
                ephemeral: true,
              })
              .catch(console.error);
          }
        }
      }
    );
  }
}
