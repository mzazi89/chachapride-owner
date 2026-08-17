export default function manifest() {
  return {
    name: 'chachapride — Owner',
    short_name: 'Owner',
    description: 'chachapride owner dashboard — drivers, rides, settlements and revenue.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'landscape',
    background_color: '#0f172a',
    theme_color: '#3b82f6',
    categories: ['business', 'finance'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
