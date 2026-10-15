import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'PathForge | Internship Decision and Career Intelligence Platform',
  description: 'Evidence-based career and internship matching for students.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

