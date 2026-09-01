const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { getConfig } = require('../utils/config');
const { addXp, xpNeededForLevel, getUser, getRank } = require('../utils/levelStore');
const { generateRankCard } = require('../utils/rankCard');
const { buildLeaderboardEmbed, buildLeaderboardRow } = require('../utils/leaderboard');

const XP_COOLDOWN_MS = 60_000;
const XP_MIN = 15;
const XP_MAX = 25;

// Matches a standalone "ip" (case-insensitive) — \b word boundaries mean
// "trip" or "flip" won't trigger it, only "ip" on its own.
const IP_REGEX = /\bip\b/i;
const IP_COOLDOWN_MS = 8_000;

// In-memory cooldown tracker: userId -> timestamp of their last XP gain.
// Intentionally not persisted — a bot restart resetting cooldowns is harmless.
const cooldowns = new Map();

// Per-channel cooldown for the IP auto-responder, so it can't be spammed.
const ipCooldowns = new Map();

/**
 * If an XP channel restriction is configured and this isn't it, tells the
 * user where to go and deletes both messages. Returns true if blocked.
 */
async function blockedByXpChannel(message, config) {
  const xpChannelId = config.leveling?.xpChannelId;
  if (!xpChannelId || message.channel.id === xpChannelId) return false;

  try {
    const reply = await message.reply(`Use this command in <#${xpChannelId}>`);
    setTimeout(() => {
      message.delete().catch(() => {});
      reply.delete().catch(() => {});
    }, 5000);
  } catch (err) {
    console.error('[Leveling] Failed to send channel-restriction notice:', err);
  }
  return true;
}

async function handleRankCommand(message, config) {
  if (await blockedByXpChannel(message, config)) return;

  const user = getUser(message.author.id);
  const rank = getRank(message.author.id) || 1;
  const neededXp = xpNeededForLevel(user.level);

  try {
    const avatarURL = message.author.displayAvatarURL({ extension: 'png', size: 256 });
    const buffer = await generateRankCard({
      username: message.member?.displayName || message.author.username,
      avatarURL,
      level: user.level,
      rank,
      currentXp: user.xp,
      neededXp,
      totalXp: user.totalXp,
      themeColor: config.themeColor,
    });
    const attachment = new AttachmentBuilder(buffer, { name: 'rank.png' });
    await message.reply({ files: [attachment] });
  } catch (err) {
    console.error('[Leveling] Failed to generate rank card:', err);
    await message.reply('❌ Could not generate your rank card right now.');
  }
}

async function handleLeaderboardCommand(message, config) {
  if (await blockedByXpChannel(message, config)) return;

  const { embed, page, totalPages } = buildLeaderboardEmbed(config, 0);
  const row = buildLeaderboardRow(page, totalPages);
  await message.reply({ embeds: [embed], components: [row] });
}

async function handleLevelUp(message, config, user) {
  const levelChannelId = config.leveling?.levelChannelId;
  const channel = levelChannelId
    ? message.guild.channels.cache.get(levelChannelId)
    : message.channel;
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(config.themeColor)
    .setDescription(`GG ${message.author}, you reached **Level ${user.level}**!`);

  await channel.send({ embeds: [embed] }).catch(() => {});

  // Assign the highest level role the user now qualifies for, and remove any lower ones.
  const levelRoles = config.leveling?.levelRoles || {};
  const thresholds = Object.keys(levelRoles).map(Number).sort((a, b) => a - b);
  let targetRoleId = null;
  for (const t of thresholds) {
    if (user.level >= t) targetRoleId = levelRoles[t];
  }
  if (!targetRoleId) return;

  try {
    const member = await message.guild.members.fetch(message.author.id);
    const allLevelRoleIds = thresholds.map(t => levelRoles[t]);
    const rolesToRemove = allLevelRoleIds.filter(id => id !== targetRoleId && member.roles.cache.has(id));
    if (rolesToRemove.length) await member.roles.remove(rolesToRemove);
    if (!member.roles.cache.has(targetRoleId)) await member.roles.add(targetRoleId);
  } catch (err) {
    console.error('[Leveling] Failed to update level roles (check role position/permissions):', err);
  }
}

async function handleIpMention(message, config) {
  const lastReply = ipCooldowns.get(message.channel.id) || 0;
  if (Date.now() - lastReply < IP_COOLDOWN_MS) return;
  ipCooldowns.set(message.channel.id, Date.now());

  const embed = new EmbedBuilder()
    .setColor(config.themeColor)
    .setTitle(`🎮 ${config.serverName} — Server Info`)
    .addFields(
      { name: 'Server IP', value: `\`${config.SERVER_IP}\``, inline: true },
      { name: 'Bedrock Port', value: `\`${config.BEDROCK_PORT}\``, inline: true },
      { name: 'Website', value: config.WEBSITE, inline: false },
    )
    .setFooter({ text: config.serverName })
    .setTimestamp();

  await message.reply({ embeds: [embed] }).catch(() => {});
}

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const config = getConfig();

    // ---- XP gain: any channel, 60s cooldown per user ----
    const lastGain = cooldowns.get(message.author.id) || 0;
    if (Date.now() - lastGain >= XP_COOLDOWN_MS) {
      cooldowns.set(message.author.id, Date.now());
      const amount = Math.floor(Math.random() * (XP_MAX - XP_MIN + 1)) + XP_MIN;
      const { leveledUp, user } = addXp(message.author.id, amount);
      if (leveledUp) {
        await handleLevelUp(message, config, user);
      }
    }

    // ---- "IP" auto-responder: works in any channel, any time ----
    if (IP_REGEX.test(message.content)) {
      await handleIpMention(message, config);
    }

    // ---- Prefix commands ----
    const content = message.content.trim().toLowerCase();
    if (content === '!rank') {
      await handleRankCommand(message, config);
    } else if (content === '!leaderboard') {
      await handleLeaderboardCommand(message, config);
    }
  },
};
