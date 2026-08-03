const fs = require('fs');
const text = fs.readFileSync('frontend/index.html', 'utf8');
const start = text.indexOf('<script>');
const end = text.indexOf('</script>', start);
if (start < 0 || end < 0) {
  console.error('script tags not found');
  process.exit(1);
}
const script = text.slice(start + 8, end);
const lines = script.split(/\r?\n/);
let total = 0;
for (let i = 0; i < lines.length; i++) {
  const count = (lines[i].match(/`/g) || []).length;
  if (count) {
    total += count;
    console.log(`${i + 1}: count=${count}, total=${total} ${lines[i]}`);
  }
  if (total % 2 === 1) {
    console.log('FIRST ODD at line', i + 1);
    process.exit(0);
  }
}
console.log('final count', total);
