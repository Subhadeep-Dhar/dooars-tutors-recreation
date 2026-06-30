import React from 'react';

export const LaurelBranch = ({ color = "currentColor", size = 64, className = "" }: { color?: string; size?: number; className?: string }) => (
  <svg 
    width={size} 
    height={size * 1.5} 
    viewBox="0 0 100 150" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    {/* Stem */}
    <path d="M 80 140 Q 30 100 30 20" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
    
    {/* Leaves (Outer - Left of stem) */}
    <path d="M 30 20 Q 0 35 20 50 Q 35 35 30 20" fill={color} />
    <path d="M 33 50 Q 0 70 25 90 Q 45 70 33 50" fill={color} />
    <path d="M 40 85 Q 5 105 35 125 Q 60 100 40 85" fill={color} />
    
    {/* Leaves (Inner - Right of stem) */}
    <path d="M 30 35 Q 60 15 55 45 Q 40 55 30 35" fill={color} />
    <path d="M 36 65 Q 70 45 65 75 Q 50 85 36 65" fill={color} />
    <path d="M 45 100 Q 80 80 75 110 Q 60 120 45 100" fill={color} />
  </svg>
);

export const LaurelBadge = ({ title, description, color }: { title: string; description: string; color: string }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center mt-6">
      <div className="flex items-center gap-2 mb-2">
        <LaurelBranch color={color} size={32} />
        <div className="flex flex-col px-1">
          <span 
            className="font-bold text-sm tracking-widest uppercase" 
            style={{ color: color }}
          >
            {title}
          </span>
        </div>
        <LaurelBranch color={color} size={32} className="scale-x-[-1]" />
      </div>
      <p 
        className="text-xs max-w-[200px] leading-relaxed mx-auto opacity-80" 
        style={{ color: 'var(--text-secondary)' }}
      >
        {description}
      </p>
    </div>
  );
};
