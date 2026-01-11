import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "./components/ui/toast-provider";
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
    default: "JSONic - Lightweight JSON Utility",
    template: "%s | JSONic"
  },
  description: "A powerful and lightweight utility designed to simplify working with JSON data. Format, validate, compare, and analyze JSON with our intelligent tools.",
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
    "JSON tools",
    "web utility",
    "developer tools",
    "online JSON editor"
  ],
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
    title: 'JSONic - Lightweight JSON Utility',
    description: 'A powerful and lightweight utility designed to simplify working with JSON data. Format, validate, compare, and analyze JSON with our intelligent tools.',
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
    title: 'JSONic - Lightweight JSON Utility',
    description: 'A powerful and lightweight utility designed to simplify working with JSON data. Format, validate, compare, and analyze JSON with our intelligent tools.',
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
    'msapplication-TileColor': '#667eea',
    'theme-color': '#667eea',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-[#fafafa] text-[#0a0a0a]`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA4_ID || ""} />
      </body>
    </html>
  );
}
