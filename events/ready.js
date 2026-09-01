const { ActivityType } = require('discord.js');
const { resumeGiveaways } = require('../utils/giveawayManager');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);

    client.user.setPresence({
      activities: [{ name: 'over Aster MC', type: ActivityType.Watching }],
      status: 'online',
    });

    // Reschedule any giveaways that were still running before a restart.
    resumeGiveaways(client);
  },
};
