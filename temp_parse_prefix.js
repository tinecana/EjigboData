const fs = require('fs');
const script=fs.readFileSync('temp_extracted_script.js','utf8');
const lines=script.split(/\r?\n/);
let low=1, high=lines.length, failIndex=lines.length+1;
while(low<=high){
  const mid=Math.floor((low+high)/2);
  const chunk=lines.slice(0,mid).join('\n');
  try{ new Function(chunk); low=mid+1; }
  catch(e){ failIndex=mid; high=mid-1; }
}
console.log('first failing prefix line', failIndex);