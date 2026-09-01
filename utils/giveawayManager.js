const { EmbedBuilder } = require('discord.js');
const JsonStore = require('./jsonStore');
const { getConfig } = require('./config');

const store = new JsonStore('giveaways.json');

// Keeps setTimeout handles in memory so we can cancel/track them.
// (Rebuilt on startup from data/giveaways.json, so restarts are safe.)
const activeTimers = new Map();

function pickWinners(participantIds, winnerCount) {
  const pool = [...participantIds];
  const winners = [];
  while (pool.length && winners.length < winnerCount) {
    const idx = Math.floor(Math.random() * pool.length);
    winners.push(pool.splice(idx, 1)[0]);
  }
  return winners;
}

async function endGiveaway(client, messageId) {
  const config = getConfig();
  const giveaway = store.get(messageId);
  if (!giveaway || giveaway.ended) return;

  giveaway.ended = true;
  store.set(messageId, giveaway);

  const timer = activeTimers.get(messageId);
  if (timer) {
    clearTimeout(timer);
    activeTimers.delete(messageId);
  }

  try {
    const channel = await client.channels.fetch(giveaway.channelId);
    const message = await channel.messages.fetch(messageId);

    // Pull fresh reaction users so last-second entries count.
    const reaction = message.reactions.cache.get('🎉');
    let participantIds = [];
    if (reaction) {
      const users = await reaction.users.fetch();
      participantIds = users.filter(u => !u.bot).map(u => u.id);
    }

    const winners = pickWinners(participantIds, giveaway.winnerCount);
    giveaway.winners = winners;
    store.set(messageId, giveaway);

    const endedEmbed = new EmbedBuilder()
      .setColor(config.themeColor)
      .setTitle(`🎉 Giveaway Ended: ${giveaway.prize}`)
      .setDescription(
        winners.length
          ? `Winner(s): ${winners.map(id => `<@${id}>`).join(', ')}\n\nHosted by <@${giveaway.hostId}>`
          : 'No valid entries — no winner could be selected.'
      )
      .setFooter({ text: `${config.serverName} Giveaways` })
      .setTimestamp();

    await message.edit({ embeds: [endedEmbed] });

    if (winners.length) {
      await channel.send({
        content: `🎉 Congratulations ${winners.map(id => `<@${id}>`).join(', ')}! You won **${giveaway.prize}**!`,
      });
    } else {
      await channel.send({ content: `No one entered the giveaway for **${giveaway.prize}**, so no winner was picked.` });
    }
  } catch (err) {
    console.error(`[Giveaways] Failed to end giveaway ${messageId}:`, err);
  }
}

function scheduleGiveaway(client, messageId, endTime) {
  const msLeft = endTime - Date.now();
  const timer = setTimeout(() => endGiveaway(client, messageId), Math.max(msLeft, 0));
  activeTimers.set(messageId, timer);
}

function createGiveaway(data) {
  // data: { messageId, channelId, guildId, hostId, prize, winnerCount, endTime }
  store.set(data.messageId, { ...data, ended: false, winners: [] });
}

/**
 * Call once on bot ready — reschedules any giveaways that were still
 * running when the bot last shut down (e.g. after a Pterodactyl restart).
 */
function resumeGiveaways(client) {
  const all = store.getAll();
  const now = Date.now();
  for (const [messageId, giveaway] of Object.entries(all)) {
    if (giveaway.ended) continue;
    if (giveaway.endTime <= now) {
      endGiveaway(client, messageId);
    } else {
      scheduleGiveaway(client, messageId, giveaway.endTime);
    }
  }
}

module.exports = {
  store,
  createGiveaway,
  scheduleGiveaway,
  endGiveaway,
  resumeGiveaways,
};
