'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export type SignaturePath = {
  d: string;
  duration: number;
  delay: number;
  ease?: any;
};

interface AnimatedSignatureProps {
  className?: string;
  paths: SignaturePath[];
  strokeWidth?: number;
}

export default function AnimatedSignature({ className, paths, strokeWidth = 0.8 }: AnimatedSignatureProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <svg 
      ref={ref}
      viewBox="0 0 297 210"
      className={className}
    >
      {paths.map((path, index) => (
        <motion.path
          key={index}
          d={path.d}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={isInView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
          transition={{ 
            pathLength: { duration: path.duration, delay: path.delay, ease: path.ease || "easeInOut" },
            opacity: { duration: 0.01, delay: path.delay }
          }}
        />
      ))}
    </svg>
  );
}
