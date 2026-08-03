const fs = require('fs');
const text = fs.readFileSync('frontend/index.html','utf8');
const script = text.split('<script>')[1].split('</script>')[0];
const lines = script.split(/\r?\n/);
const stack = [];
let escaped = false;
for (let lineno = 0; lineno < lines.length; lineno++) {
  const line = lines[lineno];
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const nxt = line[i+1];
    const top = stack[stack.length-1]?.type || 'normal';
    if (escaped) { escaped = false; continue; }
    if (top === 'line-comment') break;
    if (top === 'block-comment') {
      if (ch === '*' && nxt === '/') { stack.pop(); i++; }
      continue;
    }
    if (top === 'single-quote') {
      if (ch === '\\') { escaped = true; continue; }
      if (ch === "'") stack.pop();
      continue;
    }
    if (top === 'double-quote') {
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '"') stack.pop();
      continue;
    }
    if (top === 'template') {
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '`') { stack.pop(); continue; }
      if (ch === '$' && nxt === '{') { stack.push({type:'template-expression', braces:0, line: lineno+1, col:i+1}); i++; continue; }
      continue;
    }
    if (top === 'template-expression') {
      if (ch === '\\') { escaped = true; continue; }
      if (ch === "'") { stack.push({type:'single-quote', line: lineno+1, col:i+1}); continue; }
      if (ch === '"') { stack.push({type:'double-quote', line: lineno+1, col:i+1}); continue; }
      if (ch === '`') { stack.push({type:'template', line: lineno+1, col:i+1}); continue; }
      if (ch === '{') { stack[stack.length-1].braces += 1; continue; }
      if (ch === '}') {
        if (stack[stack.length-1].braces > 0) { stack[stack.length-1].braces -= 1; continue; }
        stack.pop();
        continue;
      }
      continue;
    }
    // normal mode
    if (ch === '/' && nxt === '/') { stack.push({type:'line-comment', line: lineno+1, col:i+1}); i++; continue; }
    if (ch === '/' && nxt === '*') { stack.push({type:'block-comment', line: lineno+1, col:i+1}); i++; continue; }
    if (ch === "'") { stack.push({type:'single-quote', line: lineno+1, col:i+1}); continue; }
    if (ch === '"') { stack.push({type:'double-quote', line: lineno+1, col:i+1}); continue; }
    if (ch === '`') { stack.push({type:'template', line: lineno+1, col:i+1}); continue; }
  }
  if (stack[stack.length-1]?.type === 'line-comment') stack.pop();
}
console.log('stack length', stack.length);
console.log(stack.slice(-20));
