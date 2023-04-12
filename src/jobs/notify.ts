import cron from "node-cron";

import CodeModel from "../database/models/codes";
import NotifyModel from "../database/models/notify";

import { rastrearEncomendas } from "correios-brasil";
import { ICorreios } from "../interfaces/Correios";

import { bot } from "../index";

export default cron.schedule("*/5 * * * *", async () => {
  console.log("running job notify every 5 minutes");

  try {
    const findNotify = await NotifyModel.find({ status: true });

    if (!findNotify) return;

    for (const item of findNotify) {
      const codes = await CodeModel.aggregate([
        {
          $match: {
            user: item.user,
          },
        },
      ]).exec();

      if (!codes) return;

      for (const code of codes) {
        const encomenda = (await rastrearEncomendas([
          code.code,
        ])) as ICorreios[];

        if (
          !encomenda ||
          !encomenda[0] ||
          !encomenda[0].eventos ||
          !encomenda.length ||
          !encomenda[0].eventos.length
        ) {
          return;
        }

        let { eventos } = encomenda[0];
        eventos = eventos.reverse();

        const client = bot.client;
        const user = await client.users.fetch(item.user);

        if (eventos.length > code.events.length) {
          const lastEvent = eventos[eventos.length - 1];
          if (code.active) {
            await user.send({
              embeds: [
                {
                  title: code.code,
                  description: lastEvent.descricao,
                },
              ],
            });
          }
          await CodeModel.updateOne(
            { _id: code._id },
            { active: lastEvent.codigo !== "BDE", events: eventos }
          );
        }
      }
    }
    console.log("job notify finished");
  } catch (error) {
    console.log(error);
  }
});
