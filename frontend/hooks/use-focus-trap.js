'use client';

import { useEffect } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Traps focus inside an open overlay and restores it on close.
 *
 * Without this, Tab walks straight out of a modal into the page behind it: the
 * focus ring disappears from view, and a keyboard or screen-reader user is left
 * operating content that is visually covered and semantically hidden.
 *
 * @param {import('react').RefObject<HTMLElement>} ref  container to trap within
 * @param {{ active?: boolean, onEscape?: () => void }} options
 */
export function useFocusTrap(ref, { active = true, onEscape } = {}) {
  useEffect(() => {
    const container = ref.current;
    if (!active || !container) return undefined;

    const previouslyFocused = document.activeElement;

    const focusable = () =>
      [...container.querySelectorAll(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );

    // Focus the first control, falling back to the container itself so the
    // starting point is inside the overlay either way.
    const first = focusable()[0];
    if (first) first.focus();
    else {
      container.setAttribute('tabindex', '-1');
      container.focus();
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onEscape?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];

      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      // Returning focus to the trigger is what makes closing a modal feel like
      // going "back" rather than being dumped at the top of the document.
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [ref, active, onEscape]);
}
