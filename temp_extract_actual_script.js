const fs = require('fs');
const text = fs.readFileSync('frontend/index.html', 'utf8');
const start = text.lastIndexOf('<script>');
const end = text.lastIndexOf('</script>');
if (start < 0 || end < start) {
  throw new Error('Unable to locate inline script');
}
const script = text.slice(start + '<script>'.length, end);
fs.writeFileSync('temp_extracted_script.js', script, 'utf8');
console.log('wrote temp_extracted_script.js', 'start', start, 'end', end, 'len', script.length);
