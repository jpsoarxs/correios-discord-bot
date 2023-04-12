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
    console.log(`found ${findNotify.length} users with notify enabled`);

    if (!findNotify) return;

    for (const item of findNotify) {
      const codes = await CodeModel.aggregate([
        {
          $match: {
            user: item.user,
          },
        },
      ]).exec();

      console.log(`found ${codes.length} codes for user ${item.user}`);

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

        const lastEvent = eventos[eventos.length - 1];
        if (code.active) {
          console.log(
            `sending message to user ${item.user} with code ${code.code}`
          );
          await user.send({
            embeds: [
              {
                title: code.code,
                description: lastEvent.descricao,
              },
            ],
          });
        }

        if (eventos.length > code.events.length) {
          console.log(`updating code ${code.code} for user ${item.user}`);
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
