const fs = require('fs');
const script = fs.readFileSync('temp_extracted_script.js', 'utf8');
const lines = script.split(/\r?\n/);
const stack = [];
let escaped = false;
for (let lineno = 0; lineno < lines.length; lineno++) {
  const line = lines[lineno];
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const nxt = line[i+1];
    if (stack.length && stack[stack.length-1].type === 'line-comment') break;
    if (escaped) { escaped = false; continue; }
    const top = stack[stack.length-1];
    if (top && top.type === 'block-comment') {
      if (ch === '*' && nxt === '/') { stack.pop(); i++; }
      continue;
    }
    if (top && top.type === 'single-quote') {
      if (ch === '\\') { escaped = true; continue; }
      if (ch === "'") { stack.pop(); }
      continue;
    }
    if (top && top.type === 'double-quote') {
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '"') { stack.pop(); }
      continue;
    }
    if (top && top.type === 'template') {
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '`') { stack.pop(); continue; }
      if (ch === '$' && nxt === '{') { stack.push({type:'${', line: lineno+1, col:i+1}); i++; continue; }
      if (ch === '}' && stack.length && stack[stack.length-1].type === '${') { stack.pop(); continue; }
      continue;
    }
    // normal mode
    if (ch === '/' && nxt === '/') { stack.push({type:'line-comment', line: lineno+1, col:i+1}); i++; continue; }
    if (ch === '/' && nxt === '*') { stack.push({type:'block-comment', line: lineno+1, col:i+1}); i++; continue; }
    if (ch === "'") { stack.push({type:'single-quote', line: lineno+1, col:i+1}); continue; }
    if (ch === '"') { stack.push({type:'double-quote', line: lineno+1, col:i+1}); continue; }
    if (ch === '`') { stack.push({type:'template', line: lineno+1, col:i+1}); continue; }
  }
  if (stack.length && stack[stack.length-1].type === 'line-comment') stack.pop();
}
console.log('stack length', stack.length);
console.log('stack', stack.slice(-20));
