import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "./components/ui/toast-provider";
import { ThemeProvider } from "./components/theme-provider";
import { ThemeScript } from "./components/theme-script";
import { GoogleAnalytics } from "@next/third-parties/google";
import { AppShell } from "./components/shell/app-shell";
import { Footer } from "./components/footer";
import { siteJsonLd } from "@/lib/seo";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
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
    "JSON beautifier",
    "Ratnesh Maurya",
    "ratnesh-maurya.com",
    "JSON tree visualization",
    "JSON type distribution"
  ],
  alternates: {
    canonical: "https://jsonic.ratnesh-maurya.com",
  },
  authors: [
    { name: "Ratnesh Maurya", url: "https://ratnesh-maurya.com" },
  ],
  creator: "Ratnesh Maurya",
  publisher: "Ratnesh Maurya",
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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JSONic - Free Online JSON Formatter, Validator & Converter',
    description: 'Free online JSON tools: format, validate, minify, compare, convert. JSON to TypeScript & Go. JSONPath. Interactive tree view.',
    site: '@ratnesh_maurya_',
    creator: '@ratnesh_maurya_',
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  category: 'technology',
  classification: 'Developer Tools',
  applicationName: 'JSONic',
  referrer: 'origin-when-cross-origin',
  formatDetection: { telephone: false, address: false, email: false },
  appleWebApp: { capable: true, title: 'JSONic', statusBarStyle: 'black-translucent' },
  icons: {
    icon: [
      { url: '/favicon/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
      { url: '/favicon/favicon.ico', type: 'image/x-icon' },
    ],
    apple: [
      { url: '/favicon/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/favicon/favicon.ico'],
  },
  other: {
    'msapplication-TileColor': '#4f46e5',
    'theme-color': '#4f46e5',
    'author': 'Ratnesh Maurya',
    'profile:username': 'ratnesh-maurya',
    'og:see_also': 'https://ratnesh-maurya.com',
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
      <head>
        {/* Site-wide entities. Every page's own @graph references these by @id
            instead of restating them, which is the shape answer engines resolve. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd()) }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300`}
      >
        <ThemeScript />
        <ThemeProvider>
          <ToastProvider>
            <AppShell>
              {children}
              <Footer />
            </AppShell>
          </ToastProvider>
        </ThemeProvider>
        {/* an empty gaId still injects gtag.js — skip the script entirely when unset */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}
