'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function TypingAnimation({ 
  text, 
  className = '',
  delay = 0,
}: { 
  text: string | string[]; 
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const paragraphs = Array.isArray(text) ? text : [text];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.015,
        delayChildren: delay,
      },
    },
  };

  const charVariants = {
    hidden: { opacity: 0, display: 'none' },
    visible: { 
      opacity: 1, 
      display: 'inline',
    },
  };

  return (
    <div ref={ref} className={className}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {paragraphs.map((p, pIndex) => (
          <p key={pIndex} className={pIndex < paragraphs.length - 1 ? 'mb-4' : ''}>
            {p.split('').map((char, index) => (
              <motion.span key={index} variants={charVariants}>
                {char}
              </motion.span>
            ))}
          </p>
        ))}
      </motion.div>
    </div>
  );
}
