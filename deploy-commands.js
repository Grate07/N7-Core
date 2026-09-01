require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ('data' in command) {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST().setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`Deploying ${commands.length} slash command(s)...`);

    let data;
    if (process.env.GUILD_ID) {
      // Guild commands update instantly — best while developing/testing.
      data = await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log(`Registered ${data.length} guild command(s) for guild ${process.env.GUILD_ID}.`);
    } else {
      // Global commands can take up to 1 hour to propagate.
      data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log(`Registered ${data.length} global command(s). This can take up to an hour to show up everywhere.`);
    }
  } catch (error) {
    console.error('Failed to deploy commands:', error);
  }
})();
