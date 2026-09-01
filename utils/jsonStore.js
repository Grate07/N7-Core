const fs = require('fs');
const path = require('path');

/**
 * Tiny synchronous JSON-file "database".
 * Good enough for giveaway/reaction-role state on a single bot instance.
 * Avoids native-module dependencies (like quick.db/better-sqlite3) that
 * can be a pain to compile on some Pterodactyl node images.
 */
class JsonStore {
  constructor(fileName) {
    this.filePath = path.join(__dirname, '..', 'data', fileName);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, '{}');
    }
  }

  _read() {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      return raw.trim() ? JSON.parse(raw) : {};
    } catch (err) {
      console.error(`[JsonStore] Failed to read ${this.filePath}:`, err);
      return {};
    }
  }

  _write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  get(key) {
    const data = this._read();
    return data[key];
  }

  getAll() {
    return this._read();
  }

  set(key, value) {
    const data = this._read();
    data[key] = value;
    this._write(data);
    return value;
  }

  delete(key) {
    const data = this._read();
    delete data[key];
    this._write(data);
  }

  has(key) {
    const data = this._read();
    return Object.prototype.hasOwnProperty.call(data, key);
  }
}

module.exports = JsonStore;
