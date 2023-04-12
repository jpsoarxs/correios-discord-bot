import {
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";

import CodeModel from "../database/models/codes";
import NotifyModel from "../database/models/notify";

export default {
  data: new SlashCommandBuilder()
    .setName("notificar")
    .setDescription("Notifica quando o pacote for atualizado.")
    .addStringOption((option) =>
      option
        .setName("status")
        .setDescription("Digite 1 para ativar e 0 para desativar")
        .addChoices(
          { name: "Ativar", value: "true" },
          { name: "Desativar", value: "false" }
        )
        .setRequired(false)
    ),
  async execute(interaction: CommandInteraction) {
    const props = interaction.options.get("status");
    const status = props?.value === "true" ? true : false;

    const findStatus = await NotifyModel.findOne({ user: interaction.user.id });

    if (props) {
      try {
        if (findStatus) {
          console.log(
            `Updating status to ${status} for ${interaction.user.id}`
          );
          await NotifyModel.updateOne(
            { user: interaction.user.id },
            { status: status }
          );
        } else {
          console.log(
            `Creating status to ${status} for ${interaction.user.id}`
          );
          await NotifyModel.create({
            user: interaction.user.id,
            status: status,
          });
        }

        return await interaction.reply({
          content: `Notificações ${status ? "ativadas" : "desativadas"}`,
          ephemeral: true,
        });
      } catch (error) {
        console.log(error);
      }
    }

    const find = await CodeModel.find({
      user: interaction.user.id,
      active: true,
    });

    if (!find || find.length === 0) {
      return await interaction.reply({
        content: "Você não possui nenhum pacote em transporte.",
        ephemeral: true,
      });
    }

    const fields = find.map((item) => {
      return {
        name: item.code,
        value: item.events[item.events.length - 1].descricao,
      };
    });

    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("Notificações")
      .setDescription(
        'Digite /notificar "status" para ativar ou desativar as notificações.'
      )
      .addFields(fields)
      .setFooter({
        text: `Suas notificações estão ${
          findStatus?.status ? "ativadas" : "desativadas"
        }`,
      })
      .setTimestamp();

    return await interaction
      .reply({ embeds: [embed], ephemeral: true })
      .catch(console.log);
  },
};
