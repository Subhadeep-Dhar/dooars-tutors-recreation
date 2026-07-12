const fs = require('fs');
let svg = fs.readFileSync('context/founder_1_signature.svg', 'utf8');

const pathRegex = /<path[^>]*\bd=["']([^"']+)["']/g;
let match;
let paths = [];
while ((match = pathRegex.exec(svg)) !== null) {
  paths.push(match[1]);
}

if (paths.length === 0) {
  console.log('No paths found!');
  process.exit(1);
}

let pathComponents = paths.map((d, index) => {
  let delay = 0.5 + (index * 1.5);
  let dur = 1.5;
  if(index === 0) dur = 2; // first stroke
  if(index === 1) dur = 2.5; // second stroke
  if(index === 4) { delay = 0.5 + 4.5; dur = 2; }
  
  return `      <motion.path
        d="${d}"
        fill="transparent"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={isInView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: ${dur}, delay: ${delay}, ease: "easeInOut" }}
      />`;
}).join('\n');

let componentCode = `'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function Founder1Signature({ className }: { className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <svg 
      ref={ref}
      viewBox="0 0 297 210"
      className={className}
    >
${pathComponents}
    </svg>
  );
}
`;

fs.writeFileSync('client/components/svg/Founder1Signature.tsx', componentCode);
console.log('Fixed Founder1Signature.tsx');
