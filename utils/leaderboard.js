const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getLeaderboard, xpNeededForLevel } = require('./levelStore');

const PAGE_SIZE = 10;
const BAR_LENGTH = 14;

function xpBar(current, needed) {
  const filled = Math.max(0, Math.min(BAR_LENGTH, Math.round((current / needed) * BAR_LENGTH)));
  return '█'.repeat(filled) + '░'.repeat(BAR_LENGTH - filled);
}

/** Builds the leaderboard embed for a given (clamped) page. */
function buildLeaderboardEmbed(config, requestedPage) {
  const leaderboard = getLeaderboard();
  const totalPages = Math.max(1, Math.ceil(leaderboard.length / PAGE_SIZE));
  const page = Math.min(Math.max(requestedPage, 0), totalPages - 1);
  const pageItems = leaderboard.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const embed = new EmbedBuilder()
    .setColor(config.themeColor)
    .setTitle('🏆 XP LEADERBOARD')
    .setDescription('Earn XP by chatting in any channel · Updated live')
    .setFooter({ text: `${config.serverName} · Page ${page + 1} / ${totalPages}` });

  if (!pageItems.length) {
    embed.addFields({ name: 'No data yet', value: 'Nobody has earned XP yet — start chatting!' });
  } else {
    pageItems.forEach((u, i) => {
      const rank = page * PAGE_SIZE + i + 1;
      const needed = xpNeededForLevel(u.level);
      embed.addFields({
        name: `#${rank} — LVL ${u.level}`,
        value: `<@${u.userId}>\n${xpBar(u.xp, needed)}  ${u.xp}/${needed} XP  ·  Total: ${u.totalXp} XP`,
      });
    });
  }

  return { embed, page, totalPages };
}

function buildLeaderboardRow(page, totalPages) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`lb:prev:${page}`)
      .setLabel('◀ Previous')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 0),
    new ButtonBuilder()
      .setCustomId(`lb:next:${page}`)
      .setLabel('Next ▶')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page >= totalPages - 1),
  );
}

module.exports = { buildLeaderboardEmbed, buildLeaderboardRow, PAGE_SIZE };
