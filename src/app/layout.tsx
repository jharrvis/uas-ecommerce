import type { Metadata, Viewport } from 'next'
import ThemeToggle from '@/components/ui/ThemeToggle'
import './globals.css'

export const metadata: Metadata = {
  title: 'UAS Praktik E-Commerce | STIEAMA',
  description: 'Sistem Ujian Akhir Semester Praktikum E-Commerce – AK8IC115',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="bg-slate-950 text-slate-100 antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('uas-theme');
                  var theme = saved || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
                  document.documentElement.dataset.theme = theme;
                  document.documentElement.style.colorScheme = theme;
                } catch (e) {}
              })();
            `,
          }}
        />
        <ThemeToggle />
        {children}
      </body>
    </html>
  )
}
