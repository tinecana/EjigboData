const fs = require('fs');
const text = fs.readFileSync('temp_extracted_script.js', 'utf8');
const lines = text.split(/\r?\n/);
let state = 'normal';
let escaped = false;
for (let lineno = 0; lineno < 1121; lineno++) {
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
      if (ch === "'") { state = 'normal'; }
      continue;
    }
    if (state === 'double-quote') {
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '"') { state = 'normal'; }
      continue;
    }
    if (state === 'template') {
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '`') { state = 'normal'; }
      continue;
    }
    if (ch === '/' && nxt === '/') { state = 'line-comment'; i++; continue; }
    if (ch === '/' && nxt === '*') { state = 'block-comment'; i++; continue; }
    if (ch === "'") { state = 'single-quote'; continue; }
    if (ch === '"') { state = 'double-quote'; continue; }
    if (ch === '`') { state = 'template'; continue; }
  }
  if (state === 'line-comment') state = 'normal';
  if (lineno >= 1110) console.log('after line', lineno+1, 'state', state, 'content', JSON.stringify(lines[lineno]));
}
console.log('final state after 1121 lines', state);
