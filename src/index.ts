import { GatewayIntentBits, Partials } from "discord.js";
import { Client } from "./client";
import "dotenv/config";

const client = new Client({
  baseUserDirectory: __dirname,
  intents: [GatewayIntentBits.Guilds], // insert bot intents
  partials: [Partials.Channel], // insert partial events

  color: "Blurple", // insert an accent color
  typing: true,
});

client.login(process.env.TOKEN);
