const fs = require('fs');
const text = fs.readFileSync('temp_extracted_script.js', 'utf8');
const lines = text.split(/\r?\n/);
let state = 'normal';
let escaped = false;
let stack = [];
function push(type, line, col) { stack.push({type, line, col}); }
function pop() { return stack.pop(); }
for (let lineno = 0; lineno < lines.length; lineno++) {
  const line = lines[lineno];
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const nxt = line[i+1];
    const current = stack[stack.length-1]?.type || 'normal';
    if (escaped) { escaped = false; continue; }
    if (current === 'line-comment') break;
    if (current === 'block-comment') {
      if (ch === '*' && nxt === '/') { pop(); i++; }
      continue;
    }
    if (current === 'single-quote') {
      if (ch === '\\') { escaped = true; continue; }
      if (ch === "'") pop();
      continue;
    }
    if (current === 'double-quote') {
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '"') pop();
      continue;
    }
    if (current === 'template') {
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '`') { pop(); continue; }
      if (ch === '$' && nxt === '{') { push('template-expression', lineno+1, i+1); i++; continue; }
      continue;
    }
    if (current === 'template-expression') {
      if (ch === '\\') { escaped = true; continue; }
      if (ch === "'") { push('single-quote', lineno+1, i+1); continue; }
      if (ch === '"') { push('double-quote', lineno+1, i+1); continue; }
      if (ch === '`') { push('template', lineno+1, i+1); continue; }
      if (ch === '{') { push('brace', lineno+1, i+1); continue; }
      if (ch === '}') {
        while (stack.length && stack[stack.length-1].type !== 'template-expression') pop();
        if (stack.length && stack[stack.length-1].type === 'template-expression') pop();
        continue;
      }
      continue;
    }
    // normal mode
    if (ch === '/' && nxt === '/') { push('line-comment', lineno+1, i+1); i++; continue; }
    if (ch === '/' && nxt === '*') { push('block-comment', lineno+1, i+1); i++; continue; }
    if (ch === "'") { push('single-quote', lineno+1, i+1); continue; }
    if (ch === '"') { push('double-quote', lineno+1, i+1); continue; }
    if (ch === '`') { push('template', lineno+1, i+1); continue; }
  }
  if (stack.length && stack[stack.length-1].type === 'line-comment') pop();
  if (stack.length && (lineno < 80 || lineno > 1000 && lineno < 1130 || lineno > 4300)) {
    const top = stack[stack.length-1];
    if (lineno % 20 === 0 || stack.length > 0) {
      // print periodic state changes around interest areas
      console.log(`${lineno+1}: stackLen=${stack.length} top=${top?.type || 'normal'}${top ? ' line='+top.line+' col='+top.col : ''}`);
    }
  }
}
console.log('FINAL stack len', stack.length, stack.map(s=>`${s.type}@${s.line}:${s.col}`).join(' | '));
