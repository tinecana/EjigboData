const fs = require('fs');
const text = fs.readFileSync('frontend/index.html', 'utf8');
const script = text.split('<script>')[1].split('</script>')[0];
let state = 'normal';
let escaped = false;
let total = 0;
const lines = script.split(/\r?\n/);
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
      if (ch === '\\') escaped = true;
      else if (ch === "'") state = 'normal';
      continue;
    }
    if (state === 'double-quote') {
      if (ch === '\\') escaped = true;
      else if (ch === '"') state = 'normal';
      continue;
    }
    if (state === 'template') {
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '`') { state = 'normal'; total++; continue; }
      if (ch === '$' && nxt === '{') { i++; continue; }
      continue;
    }
    // normal state
    if (ch === '/' && nxt === '/') { state = 'line-comment'; i++; continue; }
    if (ch === '/' && nxt === '*') { state = 'block-comment'; i++; continue; }
    if (ch === "'") { state = 'single-quote'; continue; }
    if (ch === '"') { state = 'double-quote'; continue; }
    if (ch === '`') { state = 'template'; total++; continue; }
  }
  if (state === 'line-comment') state = 'normal';
  if (state === 'template') {
    // still in template literal across lines
  }
  if (total % 2 === 1) {
    console.log('FIRST ODD at line', lineno+1, 'line:', line);
    break;
  }
}
console.log('final total', total, 'state', state);
