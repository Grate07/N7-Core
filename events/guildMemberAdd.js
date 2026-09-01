const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const path = require('path');
const { getConfig } = require('../utils/config');

// Adds the correct English ordinal suffix: 1st, 2nd, 3rd, 4th, 11th, 21st...
function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

module.exports = {
  name: 'guildMemberAdd',
  once: false,
  async execute(member) {
    const config = getConfig();
    const { guild } = member;
    const welcomeChannelId = config.WELCOME_CHANNEL_ID;

    if (!welcomeChannelId || welcomeChannelId.startsWith('PUT_')) {
      console.warn('[Welcome] WELCOME_CHANNEL_ID is not set — run /set welcome channel or edit config.json.');
      return;
    }

    const channel = guild.channels.cache.get(welcomeChannelId);
    if (!channel) {
      console.warn(`[Welcome] Could not find welcome channel with ID ${welcomeChannelId}.`);
      return;
    }

    const memberCount = guild.memberCount;
    const bannerPath = path.join(__dirname, '..', 'assets', 'aster-banner.png');
    const banner = new AttachmentBuilder(bannerPath, { name: 'aster-banner.png' });

    const embed = new EmbedBuilder()
      .setColor(config.themeColor)
      .setAuthor({ name: `Welcome to ${config.serverName}`, iconURL: guild.iconURL() || undefined })
      .setDescription(
        `Welcome to our community, ${member}! We are absolutely thrilled to have you here. ` +
        `Make sure to read through <#${config.channels.rules}> before you get started!\n\n` +
        `You are our **${ordinal(memberCount)}** explorer!`
      )
      .addFields(
        { name: '🎯 Server IP', value: `\`${config.SERVER_IP}\``, inline: false },
        { name: '🎯 Bedrock Port', value: `\`${config.BEDROCK_PORT}\``, inline: false },
        { name: '🎯 Website', value: config.WEBSITE, inline: false },
      )
      .setImage('attachment://aster-banner.png')
      .setThumbnail(guild.iconURL() || null)
      .setFooter({ text: config.serverName })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Done reading? Check out #commands')
        .setStyle(ButtonStyle.Link)
        // Link buttons need a URL, not a channel mention — point straight at the commands channel.
        .setURL(
          config.COMMANDS_CHANNEL_ID && !config.COMMANDS_CHANNEL_ID.startsWith('PUT_')
            ? `https://discord.com/channels/${guild.id}/${config.COMMANDS_CHANNEL_ID}`
            : `https://discord.com/channels/${guild.id}`
        ),
    );

    try {
      await channel.send({ embeds: [embed], components: [row], files: [banner] });
    } catch (err) {
      console.error('[Welcome] Failed to send welcome message:', err);
    }
  },
};
