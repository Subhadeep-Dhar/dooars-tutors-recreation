import re

with open('context/founder_1_signature.svg', 'r') as f:
    svg = f.read()

paths = re.findall(r'<path[^>]*\bd=["\']([^"\']+)["\']', svg)

if not paths:
    print('No paths found!')
    exit(1)

path_components = []
for index, d in enumerate(paths):
    delay = 0.5 + (index * 1.5)
    dur = 1.5
    if index == 0: dur = 2
    if index == 1: dur = 2.5
    if index == 4:
        delay = 0.5 + 4.5
        dur = 2
        
    comp = f"""      <motion.path
        d="{d}"
        fill="transparent"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{{{ pathLength: 0, opacity: 0 }}}}
        animate={{isInView ? {{ pathLength: 1, opacity: 1 }} : {{ pathLength: 0, opacity: 0 }}}}
        transition={{{{ duration: {dur}, delay: {delay}, ease: "easeInOut" }}}}
      />"""
    path_components.append(comp)

component_code = f"""'use client';
import {{ motion, useInView }} from 'framer-motion';
import {{ useRef }} from 'react';

export default function Founder1Signature({{ className }}: {{ className?: string }}) {{
  const ref = useRef(null);
  const isInView = useInView(ref, {{ once: true, margin: "-100px" }});

  return (
    <svg 
      ref={{ref}}
      viewBox="0 0 297 210"
      className={{className}}
    >
{chr(10).join(path_components)}
    </svg>
  );
}}
"""

with open('client/components/svg/Founder1Signature.tsx', 'w') as f:
    f.write(component_code)

print('Fixed Founder1Signature.tsx with python')
