const fs = require('fs');
const text = fs.readFileSync('frontend/index.html', 'utf8');
const script = text.split('<script>')[1].split('</script>')[0];
const lines = script.split(/\r?\n/);
for (let i = 1; i <= lines.length; i++) {
  const chunk = lines.slice(0, i).join('\n');
  try {
    new Function(chunk);
  } catch (e) {
    console.log('FAILED at line', i);
    console.log('error', e.message);
    console.log('line', i, JSON.stringify(lines[i-1]));
    console.log('prev', i > 1 ? JSON.stringify(lines[i-2]) : '---');
    console.log('next', i < lines.length ? JSON.stringify(lines[i]) : '---');
    process.exit(0);
  }
}
console.log('all lines parsed');
