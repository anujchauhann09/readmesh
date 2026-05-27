'use client';

import { useState } from 'react';


export function MarkdownImage({ src, alt, width, height }) {
  const [zoom, setZoom] = useState(false);
  if (!src) return null;

  return (
    <>
      <img
        src={src}
        alt={alt || ''}
        width={width}
        height={height}
        loading="lazy"
        onClick={() => setZoom(true)}
        className="inline-block max-w-full cursor-zoom-in rounded-md border border-border/60"
      />
      {zoom && (
        <span
          role="dialog"
          aria-modal="true"
          aria-label={alt || 'Image preview'}
          onClick={() => setZoom(false)}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/80 p-6"
        >
          <img src={src} alt={alt || ''} className="max-h-full max-w-full rounded-md" />
        </span>
      )}
    </>
  );
}
