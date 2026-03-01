import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "./components/ui/toast-provider";
import { ThemeProvider } from "./components/theme-provider";
import { ThemeScript } from "./components/theme-script";
import { GoogleAnalytics } from "@next/third-parties/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://jsonic.ratnesh-maurya.com'),
  title: {
    default: "JSONic - Free Online JSON Formatter, Validator & Converter",
    template: "%s | JSONic"
  },
  description: "Free online JSON tools: format, validate, minify, compare, and convert JSON. JSON to TypeScript & Go types. JSONPath queries. Interactive tree view. No sign-up required.",
  keywords: [
    "JSON",
    "JSON formatter",
    "JSON validator",
    "JSON utility",
    "JSON converter",
    "JSON comparer",
    "JSON tree view",
    "JSON minifier",
    "JSONPath",
    "JSON to TypeScript",
    "JSON to Go",
    "JSON tools",
    "web utility",
    "developer tools",
    "online JSON editor",
    "free JSON formatter online",
    "JSON beautifier"
  ],
  alternates: {
    canonical: "https://jsonic.ratnesh-maurya.com",
  },
  authors: [{ name: "Ratnesh Maurya", url: "https://www.ratnesh-maurya.com/" }],
  creator: "Ratnesh Maurya",
  publisher: "JSONic",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://jsonic.ratnesh-maurya.com',
    title: 'JSONic - Free Online JSON Formatter, Validator & Converter',
    description: 'Free online JSON tools: format, validate, minify, compare, and convert JSON. JSON to TypeScript & Go. JSONPath. Interactive tree view.',
    siteName: 'JSONic',
    images: [
      {
        url: '/favicon.svg',
        width: 1200,
        height: 630,
        alt: 'JSONic - Lightweight JSON Utility',
        type: 'image/svg+xml',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JSONic - Free Online JSON Formatter, Validator & Converter',
    description: 'Free online JSON tools: format, validate, minify, compare, convert. JSON to TypeScript & Go. JSONPath. Interactive tree view.',
    creator: '@ratnesh_maurya_',
    images: ['/favicon.svg'],
  },
  verification: {
    google: 'your-google-verification-code',
  },
  category: 'technology',
  classification: 'Web Utility',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon', type: 'image/png', sizes: '32x32' }
    ],
    apple: '/apple-icon',
    shortcut: '/favicon.svg',
  },
  other: {
    'msapplication-TileColor': '#4f46e5',
    'theme-color': '#4f46e5',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4f46e5" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300`}
      >
        <ThemeScript />
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA4_ID || ""} />
      </body>
    </html>
  );
}
