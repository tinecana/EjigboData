const fs = require('fs');
const text = fs.readFileSync('temp_extracted_script.js', 'utf8');
const lines = text.split(/\r?\n/);
const stack = [{type:'normal'}];
let escaped = false;
for (let lineno = 0; lineno < lines.length; lineno++) {
  const line = lines[lineno];
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const nxt = line[i+1];
    const state = stack[stack.length-1].type;
    if (escaped) { escaped = false; continue; }
    if (state === 'line-comment') break;
    if (state === 'block-comment') {
      if (ch === '*' && nxt === '/') { stack.pop(); i++; }
      continue;
    }
    if (state === 'single-quote') {
      if (ch === '\\') { escaped = true; continue; }
      if (ch === "'") stack.pop();
      continue;
    }
    if (state === 'double-quote') {
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '"') stack.pop();
      continue;
    }
    if (state === 'template') {
      if (ch === '`') { stack.pop(); continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '$' && nxt === '{') { stack.push({type:'template-expression', braces:0, line:lineno+1, col:i+1}); i++; continue; }
      continue;
    }
    if (state === 'template-expression') {
      if (ch === '\\') { escaped = true; continue; }
      if (ch === "'") { stack.push({type:'single-quote', line:lineno+1, col:i+1}); continue; }
      if (ch === '"') { stack.push({type:'double-quote', line:lineno+1, col:i+1}); continue; }
      if (ch === '`') { stack.push({type:'template', line:lineno+1, col:i+1}); continue; }
      if (ch === '/' && nxt === '/') { stack.push({type:'line-comment', line:lineno+1, col:i+1}); i++; continue; }
      if (ch === '/' && nxt === '*') { stack.push({type:'block-comment', line:lineno+1, col:i+1}); i++; continue; }
      if (ch === '{') stack[stack.length-1].braces++; 
      else if (ch === '}') {
        if (stack[stack.length-1].braces > 0) { stack[stack.length-1].braces--; } else { stack.pop(); }
      }
      continue;
    }
    if (ch === '/' && nxt === '/') { stack.push({type:'line-comment', line:lineno+1, col:i+1}); i++; continue; }
    if (ch === '/' && nxt === '*') { stack.push({type:'block-comment', line:lineno+1, col:i+1}); i++; continue; }
    if (ch === "'") { stack.push({type:'single-quote', line:lineno+1, col:i+1}); continue; }
    if (ch === '"') { stack.push({type:'double-quote', line:lineno+1, col:i+1}); continue; }
    if (ch === '`') { stack.push({type:'template', line:lineno+1, col:i+1}); continue; }
  }
  if (stack[stack.length-1].type === 'line-comment') stack.pop();
  if ((lineno+1) % 100 === 0 || lineno+1 === 1778 || lineno+1 === 4314) {
    console.log('line', lineno+1, 'state', stack[stack.length-1].type, 'stack len', stack.length, 'top', stack[stack.length-1]);
  }
}
console.log('final state', stack[stack.length-1], 'stack len', stack.length);
console.log(stack.slice(-15));
