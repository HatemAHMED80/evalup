import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://evalup.fr'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/connexion',
          '/inscription',
          '/compte/',
          '/dashboard',
          '/checkout',
          '/evaluation/',
          '/diagnostic/result',
          '/diagnostic/loading',
          '/diagnostic/signup',
          '/mot-de-passe-oublie',
          '/reset-password',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
