// Require the necessary discord.js classes
//import { Client, Events, GatewayIntentBits } from 'discord.js';

// Create a new client instance
//const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
//client.once(Events.ClientReady, readyClient => {
//	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
//});

// Log in to Discord with your client's token
//client.login(process.env.DISCORD_TOKEN);
console.log('cc cmoa');

import fs from 'node:fs';
import path from 'node:path';

const commandPath = path.join(__dirname, 'commands');
const commandFolder = fs.readdirSync(commandPath);
const commandFiles = commandFolder.filter(file => file.endsWith('.ts'));

for (const file of commandFiles) {
	const filePath = path.join(commandPath, file);
	console.log(filePath);
}