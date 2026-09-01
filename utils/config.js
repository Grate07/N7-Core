const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'config.json');

/**
 * Reads config.json fresh from disk every call.
 * A plain `require('../config.json')` gets cached by Node forever, so any
 * command that edits the file (like /set) wouldn't be picked up without a
 * full bot restart. This keeps config.json as the single source of truth
 * while letting slash commands update it live.
 */
function getConfig() {
  const raw = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(raw);
}

function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/**
 * Convenience helper for setting a nested value, e.g.
 * setConfigValue(['channels', 'welcome'], '123456789012345678')
 */
function setConfigValue(keyPath, value) {
  const config = getConfig();
  let target = config;
  for (let i = 0; i < keyPath.length - 1; i++) {
    target = target[keyPath[i]];
  }
  target[keyPath[keyPath.length - 1]] = value;
  saveConfig(config);
  return config;
}

module.exports = { getConfig, saveConfig, setConfigValue };
