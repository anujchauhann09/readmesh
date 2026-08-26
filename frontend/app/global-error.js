'use client';

/**
 * Last-resort boundary for failures in the root layout itself.
 *
 * It replaces `<html>`, so none of the app's providers, fonts or theme tokens are
 * available — the styling here is deliberately inline and self-contained.
 */
export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#0B0D12',
          color: '#E7E9EE',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          padding: '1.5rem',
        }}
      >
        <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>readmesh could not start</h1>
          <p style={{ marginTop: '0.5rem', color: '#9AA1AE', fontSize: '0.9rem' }}>
            An unexpected error broke the application shell.
          </p>
          {error?.digest && (
            <p style={{ marginTop: '0.5rem', color: '#6B7280', fontSize: '0.75rem' }}>
              Reference: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '1.25rem',
              padding: '0.55rem 1.1rem',
              borderRadius: '0.5rem',
              border: 0,
              background: '#7C5CFF',
              color: 'white',
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
