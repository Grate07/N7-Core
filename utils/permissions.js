/**
 * Returns true only if the interacting member has the server's configured
 * admin role (config.ADMIN_ROLE_ID). Used to gate every /set-* config
 * command so only that one role can change bot settings.
 */
function hasAdminRole(interaction, config) {
  const roleId = config.ADMIN_ROLE_ID;
  if (!roleId || !interaction.member?.roles?.cache) return false;
  return interaction.member.roles.cache.has(roleId);
}

module.exports = { hasAdminRole };
