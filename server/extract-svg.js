const fs = require('fs');

const svgContent = fs.readFileSync('../context/loading_screen/loading.svg', 'utf8');

const pathRegex = /<path\s+d="([^"]+)"\s+fill="([^"]+)"(?:\s+transform="([^"]+)")?/g;
let match;
const paths = [];

while ((match = pathRegex.exec(svgContent)) !== null) {
  const d = match[1];
  const fill = match[2];
  const transform = match[3] || '';
  
  // Skip the massive background square (first path)
  if (d.startsWith('M0 0 C515.79 0 1031.58 0 1563 0')) continue;
  
  paths.push({ d, fill, transform });
}

fs.writeFileSync('../client/components/loader-data.json', JSON.stringify(paths, null, 2));
console.log(`Extracted ${paths.length} paths.`);
