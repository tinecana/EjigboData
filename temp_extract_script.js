const fs = require('fs');
const text = fs.readFileSync('frontend/index.html', 'utf8');
const script = text.split('<script>')[1].split('</script>')[0];
fs.writeFileSync('temp_extracted_script.js', script, 'utf8');
console.log('wrote temp_extracted_script.js');
