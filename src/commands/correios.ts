import { rastrearEncomendas } from "correios-brasil";
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { ICorreios } from "../interfaces/Correios";

import CodeModel from "../database/models/codes";

export default {
  data: new SlashCommandBuilder()
    .setName("correios")
    .setDescription("Busca informações de um pacote dos correios.")
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

    const encomenda = (await rastrearEncomendas([
      String(codigo?.value),
    ])) as ICorreios[];

    if (
      !encomenda ||
      !encomenda[0] ||
      !encomenda[0].eventos ||
      !encomenda.length ||
      !encomenda[0].eventos.length
    ) {
      return await interaction.reply({
        content: "Não foi possível encontrar o pacote.",
        ephemeral: true,
      });
    }

    let { eventos } = encomenda[0];
    eventos = eventos.reverse();

    const code = await CodeModel.findOne({ code: String(codigo?.value) });

    if (!code) {
      await CodeModel.create({
        code: String(codigo?.value),
        events: eventos,
        user: interaction.user.id,
      });
    } else {
      return await interaction.reply({
        content: "O código informado já foi utilizado.",
        ephemeral: true,
      });
    }

    return await interaction.reply({
      content:
        "Pacote encontrado e adicionado a sua lista. Digite `/pacotes` para ver seus pacotes.",
      ephemeral: true,
    });
  },
};
