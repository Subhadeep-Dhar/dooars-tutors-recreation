const fs = require('fs');
let svg = fs.readFileSync('context/founder_1_signature.svg', 'utf8');

const viewBoxMatch = svg.match(/viewBox=["'](.*?)["']/);
const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 297 210';

const pathRegex = /<path[^>]*d=["'](.*?)["'][^>]*>/gs;
let paths = [];
let match;
while ((match = pathRegex.exec(svg)) !== null) {
  paths.push(match[1]);
}

const componentCode = `'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function Founder1Signature({ className }: { className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <svg 
      ref={ref}
      viewBox="${viewBox}"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      ${paths.map((d, i) => `<motion.path
        d="${d}"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={isInView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: 3, delay: ${i * 0.5}, ease: "easeInOut" }}
        strokeWidth="1"
        stroke="var(--text-primary)"
        fill="none"
      />`).join('\n      ')}
    </svg>
  );
}
`;

fs.mkdirSync('client/components/svg', { recursive: true });
fs.writeFileSync('client/components/svg/Founder1Signature.tsx', componentCode);
console.log('Created Founder1Signature.tsx successfully. Path count:', paths.length);
