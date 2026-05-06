/**
 * src/utils/db.js
 * Centralised, synchronous helpers for reading and writing db.json.
 * Both controllers import from here — no duplication.
 */

const fs   = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/db.json');

/**
 * Read and parse db.json.
 * Throws with a clear message if the file is missing or malformed.
 * @returns {{ tasks: object[], runs: object[] }}
 */
const readDB = () => {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`db.json not found at ${DB_PATH}`);
    }
    throw new Error(`Failed to parse db.json: ${err.message}`);
  }
};

/**
 * Serialise and persist data back to db.json (pretty-printed).
 * @param {{ tasks: object[], runs: object[] }} data
 */
const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    throw new Error(`Failed to write db.json: ${err.message}`);
  }
};

module.exports = { readDB, writeDB };
