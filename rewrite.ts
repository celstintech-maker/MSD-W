import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace('import mysql from "mysql2/promise";', 'import Database from "better-sqlite3";');

content = content.replace(/const pool = mysql\.createPool\(\{[\s\S]*?\}\);/, `const sqliteDb = new Database('./database.sqlite');
const pool = {
  query: async (sql: string, params: any[] = []) => {
    // Convert MySQL ? placeholders to SQLite ? placeholders (they are the same)
    // But better-sqlite3 uses sync methods.
    try {
      // Check if it's a SELECT query
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const stmt = sqliteDb.prepare(sql);
        const rows = stmt.all(...params);
        return [rows];
      } else {
        const stmt = sqliteDb.prepare(sql);
        const result = stmt.run(...params);
        return [{ insertId: result.lastInsertRowid, affectedRows: result.changes }];
      }
    } catch (e) {
      throw e;
    }
  }
};`);

// Replace AUTO_INCREMENT with AUTOINCREMENT
content = content.replace(/AUTO_INCREMENT/g, 'AUTOINCREMENT');

// Replace LONGTEXT with TEXT
content = content.replace(/LONGTEXT/g, 'TEXT');

// Replace INSERT IGNORE with INSERT OR IGNORE
content = content.replace(/INSERT IGNORE/g, 'INSERT OR IGNORE');

// Remove ALTER TABLE MODIFY COLUMN (SQLite doesn't support it easily)
content = content.replace(/try \{\s*await pool\.query\('ALTER TABLE products MODIFY COLUMN image_url TEXT'\);\s*\} catch \(e\) \{\s*console\.log\('Could not modify image_url column, it might already be TEXT'\);\s*\}/g, '');
content = content.replace(/try \{\s*await pool\.query\('ALTER TABLE site_settings MODIFY COLUMN site_config TEXT'\);\s*await pool\.query\('ALTER TABLE site_settings MODIFY COLUMN email_settings TEXT'\);\s*await pool\.query\('ALTER TABLE site_settings MODIFY COLUMN chat_settings TEXT'\);\s*\} catch \(e\) \{\s*console\.log\('Could not modify site_settings columns, they might already be TEXT'\);\s*\}/g, '');

fs.writeFileSync('server.ts', content);
console.log('Done');
