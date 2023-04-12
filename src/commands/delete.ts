import { CommandInteraction, SlashCommandBuilder } from "discord.js";

import CodeModel from "../database/models/codes";

export default {
  data: new SlashCommandBuilder()
    .setName("remover")
    .setDescription("Remover um pacote cadastrado por você.")
    .addStringOption((option) =>
      option
        .setName("codigo")
        .setDescription("Código do pacote")
        .setRequired(true)
    ),
  async execute(interaction: CommandInteraction) {
    const codigo = interaction.options.get("codigo");

    if (!codigo) {
      return await interaction.reply({
        content: "Você precisa informar o código do pacote.",
        ephemeral: true,
      });
    }

    if (!String(codigo?.value).match(/^[A-Z]{2}[0-9]{9}[A-Z]{2}$/)) {
      return await interaction.reply({
        content: "O código informado não é válido.",
        ephemeral: true,
      });
    }

    const code = await CodeModel.findOne({
      code: String(codigo?.value),
      user: interaction.user.id,
    });

    if (!code) {
      return await interaction.reply({
        content: "Você não possui um pacote com esse código.",
        ephemeral: true,
      });
    }

    await CodeModel.deleteOne({ _id: code._id });

    return await interaction.reply({
      content: "Pacote removido com sucesso.",
      ephemeral: true,
    });
  },
};
