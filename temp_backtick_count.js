const fs = require("fs");
const text = fs.readFileSync("frontend/index.html", "utf8");
const start = text.indexOf("<script>");
const end = text.indexOf("</script>", start);
if (start < 0 || end < 0) {
  console.error("script tags not found");
  process.exit(1);
}
const code = text.slice(start + 8, end);
const lines = code.split(/\r?\n/);
let count = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineCount = (line.match(/`/g) || []).length;
  count += lineCount;
  if (lineCount > 0) {
    console.log(`${i + 1}: ${lineCount} count=${count}`);
  }
}
console.log('final count', count);
