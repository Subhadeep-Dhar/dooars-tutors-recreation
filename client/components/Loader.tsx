'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useAnimationFrame, animate } from 'framer-motion';
import pathsData from './loader-data.json';

export default function Loader() {
  const [shouldShow, setShouldShow] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [phase, setPhase] = useState<'drawing' | 'settling' | 'done'>('drawing');
  const svgRef = useRef<SVGSVGElement>(null);
  
  // A global progress value from 0 to 1
  const progress = useMotionValue(0);
  
  // State to hold path metadata for animation
  const [pathMeta, setPathMeta] = useState<{
    length: number;
    start: number;
    end: number;
    fill: string;
    d: string;
    transform: string;
    element: SVGPathElement;
  }[]>([]);

  useEffect(() => {
    if (sessionStorage.getItem('hasSeenLoader')) {
      setShouldShow(false);
    }
  }, []);

  useEffect(() => {
    if (!shouldShow) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setPhase('done');
      setTimeout(() => setShouldShow(false), 500);
      sessionStorage.setItem('hasSeenLoader', 'true');
      return;
    }

    if (!svgRef.current) return;
    
    // Process paths
    const pathElements = Array.from(svgRef.current.querySelectorAll('path'));
    
    // We need to measure lengths and find start/end points to sequence them
    let rawPaths = pathElements.map((el, i) => {
      const length = el.getTotalLength();
      let startPoint = { x: 0, y: 0 };
      let endPoint = { x: 0, y: 0 };
      try {
        startPoint = el.getPointAtLength(0);
        endPoint = el.getPointAtLength(length);
      } catch (e) {
        // Fallback for empty paths
      }
      return { 
        id: i,
        element: el, 
        length, 
        startPoint, 
        endPoint,
        d: pathsData[i].d,
        fill: pathsData[i].fill,
        transform: pathsData[i].transform
      };
    }).filter(p => p.length > 0);

    // Greedy nearest-neighbor sequencing
    const sequenced = [];
    if (rawPaths.length > 0) {
      // Find top-left most path to start
      let startIdx = 0;
      let minDistance = Infinity;
      for (let i = 0; i < rawPaths.length; i++) {
        const dist = rawPaths[i].startPoint.x + rawPaths[i].startPoint.y;
        if (dist < minDistance) {
          minDistance = dist;
          startIdx = i;
        }
      }

      let current = rawPaths.splice(startIdx, 1)[0];
      sequenced.push(current);

      while (rawPaths.length > 0) {
        let nearestIdx = 0;
        let minDist = Infinity;
        let reverseCurrent = false;

        const currentPoint = current.endPoint;

        for (let i = 0; i < rawPaths.length; i++) {
          const p = rawPaths[i];
          const distToStart = Math.hypot(p.startPoint.x - currentPoint.x, p.startPoint.y - currentPoint.y);
          const distToEnd = Math.hypot(p.endPoint.x - currentPoint.x, p.endPoint.y - currentPoint.y);
          
          if (distToStart < minDist) {
            minDist = distToStart;
            nearestIdx = i;
            reverseCurrent = false;
          }
          if (distToEnd < minDist) {
            minDist = distToEnd;
            nearestIdx = i;
            reverseCurrent = true;
          }
        }

        const next = rawPaths.splice(nearestIdx, 1)[0];
        
        // If the path's end point is closer, ideally we'd draw it backwards, 
        // but SVG path reversing is complex. For stroke-dasharray animation,
        // we'll just draw it forwards. The geometric jump is minimized.
        
        sequenced.push(next);
        current = next;
      }
    }

    const totalLength = sequenced.reduce((acc, p) => acc + p.length, 0);
    
    let currentLength = 0;
    const meta = sequenced.map(p => {
      const start = currentLength / totalLength;
      currentLength += p.length;
      const end = currentLength / totalLength;
      
      // Initialize stroke properties immediately
      p.element.style.strokeDasharray = `${p.length} ${p.length}`;
      p.element.style.strokeDashoffset = `${p.length}`;
      p.element.style.stroke = 'var(--text-primary)';
      p.element.style.strokeWidth = '2';
      p.element.style.fill = 'transparent';
      p.element.style.transition = 'fill 0.5s ease, stroke 0.5s ease';

      return {
        ...p,
        start,
        end
      };
    });

    setPathMeta(meta);
    setIsReady(true);

    // Calculate a dynamic duration based on total length, bounded between 2.5s and 4.5s
    // A standard path length might be 15000 units.
    const baseDuration = Math.min(Math.max(2.5, totalLength / 8000), 4.5);

    // Start animation
    const controls = animate(progress, 1, {
      duration: baseDuration,
      ease: [0.65, 0, 0.35, 1], // Custom premium cubic-bezier easing
      onComplete: () => {
        setPhase('settling');
        // Hold for 1000ms before starting settle animation and fade out
        setTimeout(() => {
          setPhase('done');
          sessionStorage.setItem('hasSeenLoader', 'true');
          setTimeout(() => {
            setShouldShow(false);
          }, 800); // Wait for fade out
        }, 1000);
      }
    });

    return () => controls.stop();
  }, [shouldShow, progress]);

  // Hook into the animation frame to update the individual paths based on global progress
  useAnimationFrame(() => {
    if (phase !== 'drawing' || pathMeta.length === 0) return;
    
    const currentProgress = progress.get();
    
    pathMeta.forEach(meta => {
      let localProgress = 0;
      if (currentProgress >= meta.end) {
        localProgress = 1;
      } else if (currentProgress > meta.start) {
        localProgress = (currentProgress - meta.start) / (meta.end - meta.start);
      }
      
      meta.element.style.strokeDashoffset = `${meta.length * (1 - localProgress)}`;
    });
  });

  if (!shouldShow) return null;

  return (
    <motion.div 
      id="loader-overlay"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 'done' ? 0 : 1 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
      style={{ backgroundColor: 'var(--bg-base)', display: 'var(--loader-display, flex)' }}
    >
      <motion.div
        animate={
          phase === 'settling' ? { scale: 1.02 } : 
          phase === 'done' ? { scale: 1 } : 
          { scale: 1 }
        }
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 20, 
          mass: 1 
        }}
        className="w-96 h-96 sm:w-[32rem] sm:h-[32rem] md:w-[48rem] md:h-[48rem] lg:w-[64rem] lg:h-[64rem]"
        style={{ opacity: isReady ? 1 : 0, transition: 'opacity 0.2s ease' }}
      >
        <svg 
          ref={svgRef}
          viewBox="0 0 1563 1563" 
          width="100%" 
          height="100%" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {pathsData.map((p, i) => (
            <path 
              key={i} 
              d={p.d} 
              transform={p.transform}
              style={{
                // Start transparent, filled in when 'settling' or 'done'
                fill: phase === 'drawing' ? 'transparent' : p.fill,
                stroke: phase === 'drawing' ? 'var(--text-primary)' : 'transparent',
                strokeWidth: phase === 'drawing' ? '2' : '0',
                transition: 'fill 0.5s ease, stroke 0.5s ease'
              }}
            />
          ))}
        </svg>
      </motion.div>
    </motion.div>
  );
}
