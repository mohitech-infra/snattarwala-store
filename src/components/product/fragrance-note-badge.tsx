import React from 'react';

interface FragranceNoteBadgeProps {
  note: string;
  className?: string;
}

export function FragranceNoteBadge({ note, className = '' }: FragranceNoteBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent uppercase tracking-wider border border-accent/20 ${className}`}>
      {note}
    </span>
  );
}
