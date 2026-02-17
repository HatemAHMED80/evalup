import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'EvalUp - Valorisation d\'entreprise par IA',
    short_name: 'EvalUp',
    description: 'Estimez la valeur de votre entreprise en quelques minutes grace a l\'intelligence artificielle.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#4466EE',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
