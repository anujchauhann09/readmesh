/**
 * Baseline response headers.
 *
 * The app renders untrusted third-party Markdown, so clickjacking and MIME-sniffing
 * protections are not optional. A full CSP is intentionally left off for now: the
 * Markdown pipeline injects inline styles (Shiki, KaTeX, Mermaid) that a strict
 * `style-src` would break, and shipping a policy loose enough to allow them would
 * mostly be theatre. The framing, sniffing and referrer controls below are the parts
 * that can be enforced without weakening them to nothing.
 */
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  // Only meaningful over HTTPS; browsers ignore it on plain http://localhost.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@readmesh/shared'],
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['lucide-react', 'react-markdown'],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
