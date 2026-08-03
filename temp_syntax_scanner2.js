const fs = require('fs');
const script = fs.readFileSync('temp_extracted_script.js', 'utf8');
const lines = script.split(/\r?\n/);
let state = 'normal';
let escaped = false;
let openTemplates = [];
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
      if (ch === '`') { state = 'normal'; openTemplates.pop(); continue; }
      if (ch === '$' && nxt === '{') { openTemplates.push({type:'${', line: lineno+1, col: i+1}); i++; continue; }
      if (ch === '}') {
        if (openTemplates.length && openTemplates[openTemplates.length-1].type === '${') {
          openTemplates.pop();
        }
        continue;
      }
      continue;
    }
    // normal state
    if (ch === '/' && nxt === '/') { state = 'line-comment'; i++; continue; }
    if (ch === '/' && nxt === '*') { state = 'block-comment'; i++; continue; }
    if (ch === "'") { state = 'single-quote'; continue; }
    if (ch === '"') { state = 'double-quote'; continue; }
    if (ch === '`') { state = 'template'; openTemplates.push({type:'template', line: lineno+1, col: i+1}); continue; }
  }
  if (state === 'line-comment') state = 'normal';
}
console.log('final state', state);
console.log('openTemplates length', openTemplates.length);
console.log('openTemplates last 5', openTemplates.slice(-5));
