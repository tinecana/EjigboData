const fs = require('fs');
const text = fs.readFileSync('frontend/index.html', 'utf8');
const script = text.split('<script>')[1].split('</script>')[0];
const lines = script.split(/\r?\n/);
let total = 0;
for (let i = 0; i < lines.length; i++) {
  const count = (lines[i].match(/`/g) || []).length;
  if (count) {
    console.log(`${i + 1}: count=${count}, total_before=${total}, line=${lines[i]}`);
  }
  total += count;
  if (total % 2 === 1) {
    console.log('FIRST ODD at line', i + 1);
    console.log('line content:', lines[i]);
    console.log('prev line:', lines[i-1]);
    console.log('next line:', lines[i+1]);
    break;
  }
}
console.log('final total', total);
