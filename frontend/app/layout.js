import './globals.css';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { APP_NAME, APP_TAGLINE } from '@readmesh/shared';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { DialogProvider } from '@/providers/dialog-provider';
import { AuthGateProvider } from '@/providers/auth-gate-provider';
import { MeshBackground } from '@/components/visual/mesh-background';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
  display: 'swap',
});
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata = {
  title: `${APP_NAME} — read the mesh of any codebase`,
  description: APP_TAGLINE,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${display.variable} ${mono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
          themes={['light', 'dark', 'github', 'dracula', 'nord', 'vscode']}
        >
          <div className="rm-app-bg" aria-hidden />
          <div className="rm-grid" aria-hidden />
          <MeshBackground />

          <QueryProvider>
            <DialogProvider>
              <AuthGateProvider>{children}</AuthGateProvider>
            </DialogProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
