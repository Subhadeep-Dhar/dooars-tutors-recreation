const fs = require('fs');

const svgContent = fs.readFileSync('../context/loading_screen/loading.svg', 'utf8');

const pathRegex = /<path[^>]*d="([^"]+)"[^>]*>/g;
let match;
const paths = [];

while ((match = pathRegex.exec(svgContent)) !== null) {
  const fullPathTag = match[0];
  const d = match[1];
  
  // Skip the massive background square
  if (d.startsWith('m0 781.5v781.5h1563v-1563h-1563z') || d.startsWith('M0 0 C515.79')) continue;
  
  let fill = '#fffefe';
  if (fullPathTag.includes('class="s0"')) fill = '#010000';
  if (fullPathTag.includes('class="s1"')) fill = '#fffefe';
  
  let transform = '';
  const transformMatch = fullPathTag.match(/transform="([^"]+)"/);
  if (transformMatch) transform = transformMatch[1];
  
  paths.push({ d, fill, transform });
}

fs.writeFileSync('../client/components/loader-data.json', JSON.stringify(paths, null, 2));
console.log(`Extracted ${paths.length} paths.`);
