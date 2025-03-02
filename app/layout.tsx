import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

// Otimização da fonte para melhor performance
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
  preload: true
});

export const metadata: Metadata = {
  title: 'Rádio DoubleG',
  description: 'Web rádio comunitária para conectar pessoas pela música',
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      }
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
  themeColor: '#8a2be2',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Rádio DoubleG',
  },
  applicationName: 'Rádio DoubleG',
  keywords: ['rádio', 'música', 'comunidade', 'stream', 'áudio', 'DoubleG'],
  manifest: '/manifest.json',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'format-detection': 'telephone=no',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#8a2be2',
    'msapplication-tap-highlight': 'no',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <meta name="theme-color" content="#8a2be2" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}