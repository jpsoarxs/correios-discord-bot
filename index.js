const { rastrearEncomendas } = require("correios-brasil");
const cron = require("node-cron");
const config = require("./src/config/environment");

const client = require("twilio")(
  config.TWILLO_ACCOUNT_SID,
  config.TWILLO_AUTH_TOKEN
);

const codRastreio = ["LB567851330HK"];
let store;

const rastreio = async () => {
  const response = await rastrearEncomendas(codRastreio);
  let send = false;

  if (!store) {
    store = response[0];
  }

  for (let item of response) {
    const storeEventSize = store.eventos.length;

    if (item.eventos.length > storeEventSize) {
      console.log("=====================================");
      console.log("Uma nova atualização foi encontrada!");

      const lastEvent = item.eventos[0];

      console.log("Descrição: ", lastEvent.descricao);

      store = item;

      let unidate = "Sem informação de unidade";

      if (lastEvent.unidade && lastEvent.unidadeDestino) {
        unidate = `${lastEvent.unidade.endereco.cidade} -> ${lastEvent.unidadeDestino.endereco.cidade}`;
      }

      console.log("Enviando SMS...");
      try {
        const sms = await client.messages.create({
          body: `Nova atualização de rastreio: ${lastEvent.descricao} (${unidate})`,
          from: "+15075165761",
          to: "+5511991522282",
        });

        send = true;

        console.log("SMS enviado com sucesso! ID de envio: ", sms.sid);
      } catch (error) {
        console.error(error);
      }
      console.log("=====================================");
    }

    if (!send) {
      console.log("Sem atualização");
    }
  }
};

cron.schedule("* * * * *", () => {
  console.log("Verificando status do rastreio...");
  rastreio();
});
