'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const DialogContext = createContext(null);

export const useDialog = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within <DialogProvider>');
  return ctx;
};

export function DialogProvider({ children }) {
  const [state, setState] = useState(null); 

  const open = useCallback(
    (kind, options = {}) =>
      new Promise((resolve) => {
        resolveRef.current = resolve;
        setState({ kind, options });
      }),
    [],
  );

  const settle = useCallback((value) => {
    setState(null);
    const resolve = resolveRef.current;
    resolveRef.current = null;
    resolve?.(value);
  }, []);

  const api = useMemo(
    () => ({
      prompt: (options) => open('prompt', options),
      confirm: (options) => open('confirm', options),
      alert: (options) => open('alert', options),
    }),
    [open],
  );

  return (
    <DialogContext.Provider value={api}>
      {children}
      {state && (
        <DialogModal
          kind={state.kind}
          options={state.options}
          onCancel={() => settle(state.kind === 'confirm' ? false : null)}
          onSubmit={settle}
        />
      )}
    </DialogContext.Provider>
  );
}

function DialogModal({ kind, options, onCancel, onSubmit }) {
  const fields = options.fields ?? [];
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? ''])),
  );
  const firstRef = useRef(null);

  useEffect(() => {
    const el = firstRef.current;
    el?.focus();
    el?.select?.();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const submit = (e) => {
    e?.preventDefault();
    if (kind === 'prompt') onSubmit(values);
    else if (kind === 'confirm') onSubmit(true);
    else onSubmit();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={options.title || 'Dialog'}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <form
        onSubmit={submit}
        className="relative w-full max-w-md rounded-lg border border-border bg-popover p-5 text-popover-foreground shadow-xl"
      >
        {options.title && <h2 className="text-base font-semibold">{options.title}</h2>}
        {options.description && (
          <p className="mt-1 text-sm text-muted-foreground">{options.description}</p>
        )}

        {kind === 'prompt' && (
          <div className="mt-4 space-y-3">
            {fields.map((f, i) => (
              <div key={f.name} className="space-y-1.5">
                {f.label && (
                  <label htmlFor={`dlg-${f.name}`} className="text-sm font-medium">
                    {f.label}
                  </label>
                )}
                <input
                  id={`dlg-${f.name}`}
                  ref={i === 0 ? firstRef : undefined}
                  type={f.type || 'text'}
                  required={f.required}
                  value={values[f.name]}
                  placeholder={f.placeholder}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          {kind !== 'alert' && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
            >
              {options.cancelLabel ?? 'Cancel'}
            </button>
          )}
          <button
            type="submit"
            ref={kind === 'prompt' ? undefined : firstRef}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium',
              options.destructive
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90',
            )}
          >
            {options.submitLabel ?? options.confirmLabel ?? options.okLabel ?? 'OK'}
          </button>
        </div>
      </form>
    </div>
  );
}
