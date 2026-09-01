const { getConfig } = require('../utils/config');
const { buildLeaderboardEmbed, buildLeaderboardRow } = require('../utils/leaderboard');

async function handleReactionRoleButton(interaction) {
  const key = interaction.customId.split(':')[1];
  const config = getConfig();
  const roleId = config.reactionRoles[key];

  if (!roleId || roleId.startsWith('PUT_')) {
    return interaction.reply({ content: '❌ This role is not configured yet.', ephemeral: true });
  }

  try {
    const member = interaction.member;
    if (member.roles.cache.has(roleId)) {
      await member.roles.remove(roleId);
      return interaction.reply({ content: '🔕 Role removed.', ephemeral: true });
    } else {
      await member.roles.add(roleId);
      return interaction.reply({ content: '✅ Role added!', ephemeral: true });
    }
  } catch (err) {
    console.error('[ReactionRoles] Button role toggle failed:', err);
    return interaction.reply({
      content: '❌ Could not update your roles — make sure the bot\'s role is positioned above this role.',
      ephemeral: true,
    });
  }
}

async function handleLeaderboardButton(interaction) {
  const [, direction, pageStr] = interaction.customId.split(':');
  const config = getConfig();

  let page = parseInt(pageStr, 10) || 0;
  page = direction === 'next' ? page + 1 : page - 1;

  const { embed, page: clampedPage, totalPages } = buildLeaderboardEmbed(config, page);
  const row = buildLeaderboardRow(clampedPage, totalPages);
  await interaction.update({ embeds: [embed], components: [row] });
}

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) {
        console.warn(`[Interaction] No command matching "${interaction.commandName}" was found.`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`[Interaction] Error executing "${interaction.commandName}":`, error);
        const errorReply = { content: '❌ Something went wrong while running that command.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorReply).catch(() => {});
        } else {
          await interaction.reply(errorReply).catch(() => {});
        }
      }
      return;
    }

    if (interaction.isButton()) {
      try {
        if (interaction.customId.startsWith('rr:')) {
          return await handleReactionRoleButton(interaction);
        }
        if (interaction.customId.startsWith('lb:')) {
          return await handleLeaderboardButton(interaction);
        }
      } catch (error) {
        console.error('[Interaction] Error handling button:', error);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: '❌ Something went wrong.', ephemeral: true }).catch(() => {});
        }
      }
    }
  },
};
