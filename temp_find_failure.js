const fs = require('fs');
const script = fs.readFileSync('temp_extracted_script.js', 'utf8');
const lines = script.split(/\r?\n/);
function test(end) {
  const chunk = lines.slice(0, end).join('\n');
  try {
    new Function(chunk);
    return true;
  } catch (e) {
    return e.message;
  }
}
let low = 1;
let high = lines.length;
let fail = high;
while (low <= high) {
  const mid = Math.floor((low + high) / 2);
  const result = test(mid);
  if (result === true) {
    low = mid + 1;
  } else {
    fail = mid;
    high = mid - 1;
  }
}
console.log('first failing line', fail, 'message', test(fail));
for (let i = Math.max(1, fail-5); i <= fail+2; i++) {
  console.log(`${i}: ${JSON.stringify(lines[i-1])}`);
}
