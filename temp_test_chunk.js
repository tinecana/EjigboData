const fs = require('fs');
const script = fs.readFileSync('temp_extracted_script.js', 'utf8');
const lines = script.split(/\r?\n/);
const chunk = lines.slice(0, 1121).join('\n');
try {
  new Function(chunk);
  console.log('chunk parsed OK');
} catch (e) {
  console.error('parse failed:', e.message);
  console.error('stack:', e.stack);
}
