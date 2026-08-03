const fs = require('fs');
const text = fs.readFileSync('frontend/index.html', 'utf8');
let start = text.lastIndexOf('<script>');
let end = text.lastIndexOf('</script>');
console.log('start', start, 'end', end);
const script = text.slice(start + '<script>'.length, end);
const lines = script.split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
  if (i >= 315 && i < 330) console.log((i+1)+': '+lines[i]);
}
console.log('--- TEMPS ---');
for (let i = 0; i < 20; i++) console.log((i+1)+': '+lines[i]);
console.log('total lines', lines.length);
