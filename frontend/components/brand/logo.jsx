'use client';

import { useId } from 'react';
import { APP_NAME } from '@readmesh/shared';
import { cn } from '@/lib/utils';

/*
  The readmesh mark — a small constellation of connected nodes (a mesh).
  Three outer nodes link to a bright central node, drawn with the brand
  violet→cyan gradient. Used everywhere a logo is needed.
*/
export function LogoMark({ className, size = 28 }) {
  const id = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={`${id}-g`} x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(var(--brand-violet))" />
          <stop offset="1" stopColor="hsl(var(--brand-cyan))" />
        </linearGradient>
      </defs>
      {/* connections */}
      <g stroke={`url(#${id}-g)`} strokeWidth="1.6" strokeLinecap="round" opacity="0.85">
        <line x1="16" y1="16" x2="6" y2="7" />
        <line x1="16" y1="16" x2="26" y2="9" />
        <line x1="16" y1="16" x2="9" y2="26" />
        <line x1="16" y1="16" x2="25" y2="24" />
        <line x1="6" y1="7" x2="26" y2="9" />
        <line x1="9" y1="26" x2="25" y2="24" />
      </g>
      {/* outer nodes */}
      <g fill={`url(#${id}-g)`}>
        <circle cx="6" cy="7" r="2.4" />
        <circle cx="26" cy="9" r="2.4" />
        <circle cx="9" cy="26" r="2.4" />
        <circle cx="25" cy="24" r="2.4" />
      </g>
      {/* core node */}
      <circle cx="16" cy="16" r="4.2" fill="hsl(var(--background))" />
      <circle cx="16" cy="16" r="3.4" fill={`url(#${id}-g)`} />
    </svg>
  );
}

export function Logo({ className, markSize = 28, showName = true, nameClassName }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative inline-flex">
        <span className="absolute inset-0 -z-10 rounded-full bg-brand-violet/30 blur-md" aria-hidden />
        <LogoMark size={markSize} />
      </span>
      {showName && (
        <span
          className={cn(
            'font-display text-[1.05rem] font-semibold tracking-tight text-foreground',
            nameClassName,
          )}
        >
          read<span className="text-gradient">mesh</span>
        </span>
      )}
    </span>
  );
}

export { APP_NAME };
