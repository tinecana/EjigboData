const fs = require('fs');
const text = fs.readFileSync('temp_extracted_script.js', 'utf8');
const lines = text.split(/\r?\n/).slice(0, 1121);
const stack = [];
const state = {type:'normal', escaped:false};
for (let lineno = 0; lineno < lines.length; lineno++) {
  const line = lines[lineno];
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const nxt = line[i+1];
    if (state.escaped) { state.escaped = false; continue; }
    if (state.type === 'line-comment') break;
    if (state.type === 'block-comment') {
      if (ch === '*' && nxt === '/') { state.type = 'normal'; i++; }
      continue;
    }
    if (state.type === 'single') {
      if (ch === '\\') { state.escaped = true; continue; }
      if (ch === "'") state.type = 'normal';
      continue;
    }
    if (state.type === 'double') {
      if (ch === '\\') { state.escaped = true; continue; }
      if (ch === '"') state.type = 'normal';
      continue;
    }
    if (state.type === 'template') {
      if (ch === '\\') { state.escaped = true; continue; }
      if (ch === '`') { state.type = 'normal'; continue; }
      if (ch === '$' && nxt === '{') { stack.push({type:'${', line: lineno+1, col:i+1}); i++; continue; }
      continue;
    }
    if (ch === '/' && nxt === '/') { state.type = 'line-comment'; i++; continue; }
    if (ch === '/' && nxt === '*') { state.type = 'block-comment'; i++; continue; }
    if (ch === "'") { state.type = 'single'; continue; }
    if (ch === '"') { state.type = 'double'; continue; }
    if (ch === '`') { state.type = 'template'; continue; }
    if (ch === '(') stack.push({type:'(', line: lineno+1, col:i+1});
    if (ch === '{') stack.push({type:'{', line: lineno+1, col:i+1});
    if (ch === '[') stack.push({type:'[', line: lineno+1, col:i+1});
    if (ch === ')') {
      const top = stack.pop();
      if (!top || top.type !== '(') console.log('mismatch ) at', lineno+1, i+1, 'top', top);
    }
    if (ch === '}') {
      const top = stack.pop();
      if (!top || top.type !== '{') console.log('mismatch } at', lineno+1, i+1, 'top', top);
    }
    if (ch === ']') {
      const top = stack.pop();
      if (!top || top.type !== '[') console.log('mismatch ] at', lineno+1, i+1, 'top', top);
    }
    if (state.type === 'line-comment') state.type='normal';
  }
  if (state.type === 'line-comment') state.type='normal';
}
console.log('state', state.type, 'stack len', stack.length);
console.log('stack tail', stack.slice(-20));
