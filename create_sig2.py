import re
import os

with open('context/founder_2_signature.svg', 'r') as f:
    svg = f.read()

paths = re.findall(r'<path[^>]*\bd=["\']([^"\']+)["\']', svg)

if not paths:
    print('No paths found!')
    exit(1)

path_components = []
for index, d in enumerate(paths):
    # Adjust durations manually since there are 3 strokes
    if index == 0:
        dur = 2.0
        delay = 0.5
    elif index == 1:
        dur = 1.0
        delay = 2.0
    else: # index 2
        dur = 3.5
        delay = 3.0
        
    comp = f"""      <motion.path
        d="{d}"
        fill="transparent"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{{{ pathLength: 0, opacity: 0 }}}}
        animate={{isInView ? {{ pathLength: 1, opacity: 1 }} : {{ pathLength: 0, opacity: 0 }}}}
        transition={{{{ 
          pathLength: {{ duration: {dur}, delay: {delay}, ease: "easeInOut" }},
          opacity: {{ duration: 0.01, delay: {delay} }}
        }}}}
      />"""
    path_components.append(comp)

component_code = f"""'use client';
import {{ motion, useInView }} from 'framer-motion';
import {{ useRef }} from 'react';

export default function Founder2Signature({{ className }}: {{ className?: string }}) {{
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

os.makedirs('client/components/svg', exist_ok=True)
with open('client/components/svg/Founder2Signature.tsx', 'w') as f:
    f.write(component_code)

print('Generated Founder2Signature.tsx')
