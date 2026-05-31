'use client';

import { useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DocSearch({ query, onQueryChange, count, activeIndex, onNext, onPrev, onClear }) {
  const inputRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const hasQuery = query.trim().length > 0;

  const onInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (event.shiftKey) onPrev();
      else onNext();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClear();
      inputRef.current?.blur();
    }
  };

  return (
    <div className="flex h-8 w-full max-w-sm items-center gap-1 rounded-md border border-input bg-background px-2">
      <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={onInputKeyDown}
        placeholder="Search in document…"
        aria-label="Search in document"
        className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      {hasQuery && (
        <div className="flex shrink-0 items-center gap-0.5">
          <span className="px-1 text-xs tabular-nums text-muted-foreground">
            {count > 0 ? `${activeIndex + 1}/${count}` : '0/0'}
          </span>
          <SearchAction label="Previous match" onClick={onPrev} disabled={count === 0}>
            <ChevronUp className="h-3.5 w-3.5" />
          </SearchAction>
          <SearchAction label="Next match" onClick={onNext} disabled={count === 0}>
            <ChevronDown className="h-3.5 w-3.5" />
          </SearchAction>
          <SearchAction label="Clear search" onClick={onClear}>
            <X className="h-3.5 w-3.5" />
          </SearchAction>
        </div>
      )}
    </div>
  );
}

function SearchAction({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground',
        'disabled:pointer-events-none disabled:opacity-40',
      )}
    >
      {children}
    </button>
  );
}
