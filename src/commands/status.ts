import {
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import connection from "../database/connection";
export default {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("Verificar o status de todos os serviços."),
  async execute(interaction: CommandInteraction) {
    const isOnline = async () => {
      try {
        await fetch("https://proxyapp.correios.com.br/v1/sro-rastro");
        return true;
      } catch (error) {
        return false;
      }
    };

    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("Status")
      .addFields(
        {
          name: "Database",
          value: connection.readyState ? "Conectado" : "Desconectado",
          inline: true,
        },
        {
          name: "Correios",
          value: (await isOnline()) ? "Online" : "Offline",
          inline: true,
        },
        {
          name: "Bot",
          value: "Online",
          inline: true,
        }
      )
      .setTimestamp();

    return await interaction.reply({ embeds: [embed] }).catch(console.log);
  },
};
