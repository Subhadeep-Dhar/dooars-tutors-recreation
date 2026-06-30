import React from 'react';

export const LaurelBranch = ({ color = "currentColor", size = 64, className = "" }: { color?: string; size?: number; className?: string }) => (
  <svg 
    width={size} 
    height={size * 2} 
    viewBox="0 0 100 200" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    {/* Stem - curving gracefully from bottom right to top left */}
    <path d="M 90 190 Q 60 180 30 140 T 20 20" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
    
    {/* Outer Leaves (Left of stem) */}
    <path d="M 20 20 Q -10 30 10 50 Q 30 40 25 25" fill={color} />
    <path d="M 22 55 Q -10 70 15 90 Q 35 75 27 60" fill={color} />
    <path d="M 27 90 Q 0 110 25 130 Q 45 110 33 95" fill={color} />
    <path d="M 37 130 Q 15 150 45 160 Q 60 140 45 130" fill={color} />
    <path d="M 55 165 Q 40 185 75 185 Q 85 170 65 160" fill={color} />

    {/* Inner Leaves (Right of stem) */}
    <path d="M 23 40 Q 50 20 50 50 Q 40 60 25 45" fill={color} />
    <path d="M 28 75 Q 60 55 55 85 Q 45 95 31 80" fill={color} />
    <path d="M 35 115 Q 70 95 65 125 Q 55 135 40 120" fill={color} />
    <path d="M 48 150 Q 80 135 75 160 Q 65 170 52 155" fill={color} />
    <path d="M 70 175 Q 95 165 95 185 Q 85 195 73 180" fill={color} />
  </svg>
);

export const LaurelBadge = ({ title, description, color }: { title: string; description: string; color: string }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center mt-6">
      <div className="flex items-center justify-center gap-1 mb-2 relative">
        <LaurelBranch color={color} size={56} className="translate-y-2 opacity-90" />
        <div className="flex flex-col px-1 shrink-0 z-10 mx-[-8px]">
          <span 
            className="font-bold text-[0.8rem] tracking-widest uppercase" 
            style={{ color: color }}
          >
            {title}
          </span>
        </div>
        <LaurelBranch color={color} size={56} className="scale-x-[-1] translate-y-2 opacity-90" />
      </div>
      <p 
        className="text-xs max-w-[220px] leading-relaxed mx-auto opacity-80" 
        style={{ color: 'var(--text-secondary)' }}
      >
        {description}
      </p>
    </div>
  );
};
