const fs = require('fs');
const text = fs.readFileSync('frontend/index.html', 'utf8');
const script = text.split('<script>')[1].split('</script>')[0];
const lines = script.split(/\r?\n/);
let state = 'normal';
let escaped = false;
let startLine = null;
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
      if (ch === '`') { state = 'normal'; startLine = null; }
      continue;
    }
    if (ch === '/' && nxt === '/') { state = 'line-comment'; i++; continue; }
    if (ch === '/' && nxt === '*') { state = 'block-comment'; i++; continue; }
    if (ch === "'") { state = 'single-quote'; continue; }
    if (ch === '"') { state = 'double-quote'; continue; }
    if (ch === '`') { state = 'template'; startLine = lineno + 1; continue; }
  }
  if (state === 'line-comment') state = 'normal';
}
console.log('final state', state, 'startLine', startLine);