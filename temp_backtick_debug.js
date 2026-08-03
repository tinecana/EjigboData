const fs = require('fs');
const script = fs.readFileSync('frontend/index.html', 'utf8').split('<script>')[1].split('</script>')[0];
const lines = script.split(/\r?\n/);
let total = 0;
for (let i = 0; i < lines.length; i++) {
  const count = (lines[i].match(/`/g) || []).length;
  if (count) {
    total += count;
    console.log(`${i + 1}: count=${count}, total=${total}, line=${lines[i]}`);
  }
}
console.log('final count', total);
