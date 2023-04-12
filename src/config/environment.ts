require("dotenv").config();

interface IEnvironment {
  DISCORD_TOKEN: string;
  DISCORD_PREFIX: string;
  MONGO_URI: string;
}

export default {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  DISCORD_PREFIX: process.env.DISCORD_PREFIX,
  MONGO_URI: process.env.MONGO_URI,
} as IEnvironment;
