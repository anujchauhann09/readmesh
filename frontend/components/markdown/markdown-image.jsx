'use client';

import { useEffect, useRef, useState } from 'react';
import { useFocusTrap } from '@/hooks/use-focus-trap';

export function MarkdownImage({ src, alt, width, height }) {
  const [zoom, setZoom] = useState(false);
  const overlayRef = useRef(null);

  useFocusTrap(overlayRef, { active: zoom, onEscape: () => setZoom(false) });

  useEffect(() => {
    if (!zoom) return undefined;
    // The overlay covers the page, so the page behind it should not scroll.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [zoom]);

  if (!src) return null;

  return (
    <>
      {/*
        A button rather than a click handler on the image: zooming is an action, and
        as a bare <img onClick> it was unreachable by keyboard entirely.
        eslint-disable-next-line reason: README images are arbitrary remote URLs from
        any GitHub repo, which next/image cannot optimize without an open remote
        allowlist — a plain <img> is the deliberate choice here.
      */}
      <button
        type="button"
        onClick={() => setZoom(true)}
        aria-label={alt ? `Zoom image: ${alt}` : 'Zoom image'}
        className="inline-block max-w-full cursor-zoom-in rounded-md align-middle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt || ''}
          width={width}
          height={height}
          loading="lazy"
          className="inline-block max-w-full rounded-md border border-border/60"
        />
      </button>

      {zoom && (
        <span
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label={alt || 'Image preview'}
          onClick={() => setZoom(false)}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/80 p-6"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt || ''} className="max-h-full max-w-full rounded-md" />
          <button
            type="button"
            onClick={() => setZoom(false)}
            className="sr-only"
            aria-label="Close image preview"
          >
            Close
          </button>
        </span>
      )}
    </>
  );
}
