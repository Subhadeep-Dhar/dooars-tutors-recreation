const fs = require('fs');
let svg = fs.readFileSync('../client/public/images/loading_better.svg', 'utf8');
svg = svg.replace(/<path id="Path 0" class="s0" d="[^"]+"\/>/, '');
fs.writeFileSync('../client/public/images/loading_better.svg', svg);
console.log('Done');
