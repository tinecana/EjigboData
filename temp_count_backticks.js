const fs = require('fs');
const text = fs.readFileSync('frontend/index.html', 'utf8');
const script = text.split('<script>')[1].split('</script>')[0];
const lines = script.split(/\r?\n/);
let total = 0;
for (let i = 0; i < lines.length; i++) {
  const count = (lines[i].match(/`/g) || []).length;
  total += count;
}
console.log('full backtick count:', total);
