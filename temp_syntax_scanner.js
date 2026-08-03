const fs = require('fs');
const text = fs.readFileSync('temp_extracted_script.js','utf8');
const lines = text.split(/\r?\n/);
let state = {quote: null, template: false, escaped: false, comment: null};
let stack = [];
for (let lineno = 0; lineno < lines.length; lineno++) {
  const line = lines[lineno];
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const nxt = line[i+1];
    if (state.comment) {
      if (state.comment === 'line') break;
      if (state.comment === 'block' && ch === '*' && nxt === '/') { state.comment = null; i++; continue; }
      continue;
    }
    if (state.escaped) { state.escaped = false; continue; }
    if (state.quote) {
      if (ch === '\\') { state.escaped = true; continue; }
      if (ch === state.quote) { state.quote = null; }
      continue;
    }
    if (state.template) {
      if (ch === '`') { state.template = false; continue; }
      if (ch === '$' && nxt === '{') { stack.push({type:'${', line: lineno+1, col: i+1}); i++; continue; }
      if (ch === '\\') { state.escaped = true; continue; }
      continue;
    }
    if (ch === '/' && nxt === '/') { state.comment = 'line'; i++; continue; }
    if (ch === '/' && nxt === '*') { state.comment = 'block'; i++; continue; }
    if (ch === "'") { state.quote = "'"; continue; }
    if (ch === '"') { state.quote = '"'; continue; }
    if (ch === '`') { state.template = true; continue; }
    if (ch === '{') { stack.push({type:'{', line: lineno+1, col: i+1}); continue; }
    if (ch === '(') { stack.push({type:'(', line: lineno+1, col: i+1}); continue; }
    if (ch === '[') { stack.push({type:'[', line: lineno+1, col: i+1}); continue; }
    if (ch === '}') { if (!stack.length || stack[stack.length-1].type !== '{') return console.log('UNMATCHED } at', lineno+1, i+1, stack[stack.length-1]); stack.pop(); continue; }
    if (ch === ')') { if (!stack.length || stack[stack.length-1].type !== '(') return console.log('UNMATCHED ) at', lineno+1, i+1, stack[stack.length-1]); stack.pop(); continue; }
    if (ch === ']') { if (!stack.length || stack[stack.length-1].type !== '[') return console.log('UNMATCHED ] at', lineno+1, i+1, stack[stack.length-1]); stack.pop(); continue; }
  }
  if (state.comment === 'line') state.comment = null;
}
console.log('end state', state, 'stack top', stack.slice(-3));
console.log('stack length', stack.length);
