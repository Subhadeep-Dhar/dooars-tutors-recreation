"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface WordRotatorProps {
  words: string[];
  interval?: number;
  className?: string;
}

export function WordRotator({ words, interval = 3000, className = "" }: WordRotatorProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, interval);
    return () => clearInterval(timer);
  }, [words.length, interval]);

  return (
    <span className={`relative inline-flex items-center justify-center ${className}`}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={words[index]}
          initial={{ y: "40%", opacity: 0, filter: "blur(4px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-40%", opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="inline-block"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
