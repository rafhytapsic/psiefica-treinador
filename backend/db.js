const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'psi-eficaz.db');

// Garante que a pasta data existe
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Inicializa schema
const initSql = fs.readFileSync(path.join(__dirname, 'models', 'init.sql'), 'utf8');
db.exec(initSql);

console.log('[db] SQLite conectado em:', DB_PATH);

module.exports = db;
