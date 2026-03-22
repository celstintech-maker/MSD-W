import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/INT AUTOINCREMENT PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT');

fs.writeFileSync('server.ts', content);
console.log('Done');
