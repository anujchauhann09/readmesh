import './globals.css';
import { Inter } from 'next/font/google';
import { APP_NAME, APP_TAGLINE } from '@readmesh/shared';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: `${APP_NAME} — README Viewer AI`,
  description: APP_TAGLINE,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
