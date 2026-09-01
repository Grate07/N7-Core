require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const keepAlive = require('./keepAlive');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,   // welcome messages / member join
    GatewayIntentBits.GuildMessages,  // message events (XP gain, !rank, !leaderboard)
    GatewayIntentBits.MessageContent, // required to read !rank / !leaderboard text
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.User,
    Partials.GuildMember,
  ],
});

// ---- Load slash commands ----
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`[WARN] Command file ${file} is missing "data" or "execute".`);
  }
}

// ---- Load events ----
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// ---- Keep-alive web server (for Pterodactyl / uptime monitors) ----
keepAlive();

// ---- Login ----
if (!process.env.TOKEN) {
  console.error('❌ Missing TOKEN in environment variables. Check your .env file or Pterodactyl startup variables.');
  process.exit(1);
}

client.login(process.env.TOKEN);

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});
