import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'JSONic - Lightweight JSON Utility',
    short_name: 'JSONic',
    description: 'A powerful and lightweight utility designed to simplify working with JSON data. Format, validate, compare, and analyze JSON with our intelligent tools.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f0f23',
    theme_color: '#0f0f23',
    orientation: 'portrait-primary',
    categories: ['developer', 'utilities', 'productivity'],
    icons: [
      {
        src: '/favicon.svg',
        sizes: '1200x630',
        type: 'image/svg+xml',
        purpose: 'maskable'
      }
    ],
    shortcuts: [
      {
        name: 'JSON Tree View',
        short_name: 'Tree View',
        description: 'View JSON in an interactive tree format',
        url: '/#treeview',
        icons: [{ src: '/favicon.svg', sizes: '192x192' }]
      },
      {
        name: 'JSON Validator',
        short_name: 'Validator',
        description: 'Validate your JSON with intelligent error reporting',
        url: '/#validator',
        icons: [{ src: '/favicon.svg', sizes: '192x192' }]
      },
      {
        name: 'JSON Comparer',
        short_name: 'Comparer',
        description: 'Compare two JSON objects and see differences',
        url: '/#comparer',
        icons: [{ src: '/favicon.svg', sizes: '192x192' }]
      },
      {
        name: 'JSON Formatter',
        short_name: 'Formatter',
        description: 'Format and beautify your JSON',
        url: '/#formatter',
        icons: [{ src: '/favicon.svg', sizes: '192x192' }]
      }
    ],
    lang: 'en',
    dir: 'ltr',
    scope: '/',
    prefer_related_applications: false
  }
}
