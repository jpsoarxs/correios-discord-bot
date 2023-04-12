import {
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";

import CodeModel from "../database/models/codes";

export default {
  data: new SlashCommandBuilder()
    .setName("pacotes")
    .setDescription("Listar os pacotes cadastrados por você."),
  async execute(interaction: CommandInteraction) {
    try {
      const find = await CodeModel.find({
        user: interaction.user.id,
      });

      const fields = find.map((item) => {
        return {
          name: item.code,
          value: `Status: ${item.active ? "Ativo" : "Entregue"}`,
        };
      });

      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle("Pacotes")
        .setDescription(
          "Todos os pacotes com status ativo recebem notificações. Para desativar, use o comando /notificar. Pacotes entregues não recebem notificações e são removidos automaticamente após 5 dias."
        )
        .addFields(fields)
        .setTimestamp();

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.log(error);
    }
  },
};
