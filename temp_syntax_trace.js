const fs = require('fs');
const script = fs.readFileSync('temp_extracted_script.js', 'utf8');
const lines = script.split(/\r?\n/);
let state = 'normal';
let escaped = false;
for (let lineno = 0; lineno < lines.length; lineno++) {
  const line = lines[lineno];
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const nxt = line[i+1];
    if (state === 'line-comment') break;
    if (escaped) { escaped = false; continue; }
    if (state === 'block-comment') {
      if (ch === '*' && nxt === '/') { state = 'normal'; i++; }
      continue;
    }
    if (state === 'single-quote') {
      if (ch === '\\') { escaped = true; continue; }
      if (ch === "'") { state = 'normal'; console.log(`line ${lineno+1} col ${i+1} exit single-quote`); }
      continue;
    }
    if (state === 'double-quote') {
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '"') { state = 'normal'; console.log(`line ${lineno+1} col ${i+1} exit double-quote`); }
      continue;
    }
    if (state === 'template') {
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '`') { state = 'normal'; console.log(`line ${lineno+1} col ${i+1} exit template`); continue; }
      if (ch === '$' && nxt === '{') { console.log(`line ${lineno+1} col ${i+1} enter template expression`); i++; continue; }
      if (ch === '}') { console.log(`line ${lineno+1} col ${i+1} exit template expression`); continue; }
      continue;
    }
    if (ch === '/' && nxt === '/') { state = 'line-comment'; console.log(`line ${lineno+1} col ${i+1} enter line-comment`); i++; continue; }
    if (ch === '/' && nxt === '*') { state = 'block-comment'; console.log(`line ${lineno+1} col ${i+1} enter block-comment`); i++; continue; }
    if (ch === "'") { state = 'single-quote'; console.log(`line ${lineno+1} col ${i+1} enter single-quote`); continue; }
    if (ch === '"') { state = 'double-quote'; console.log(`line ${lineno+1} col ${i+1} enter double-quote`); continue; }
    if (ch === '`') { state = 'template'; console.log(`line ${lineno+1} col ${i+1} enter template`); continue; }
  }
  if (state === 'line-comment') state = 'normal';
}
console.log('final state', state);