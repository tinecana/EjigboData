const fs = require('fs');
const script = fs.readFileSync('frontend/index.html', 'utf8').split('<script>')[1].split('</script>')[0];
const lines = script.split(/\r?\n/);
let inTemplate = false;
let escaped = false;
const stack = [];
for (let lineno = 0; lineno < lines.length; lineno++) {
  const line = lines[lineno];
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '`') {
      if (!inTemplate) {
        stack.push({line: lineno+1, col: i+1, char: '`', type: 'open'});
      } else {
        stack.pop();
      }
      inTemplate = !inTemplate;
    }
  }
}
console.log('open template stack length', stack.length);
console.log(stack.slice(-20));
