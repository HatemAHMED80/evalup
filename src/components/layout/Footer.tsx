import Link from 'next/link'

interface FooterLink {
  label: string
  href: string
}

interface FooterSection {
  title: string
  links: FooterLink[]
}

const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: 'Produit',
    links: [
      { label: 'Fonctionnalites', href: '/#features' },
      { label: 'Tarifs', href: '/tarifs' },
      { label: 'Aide', href: '/aide' },
    ],
  },
  {
    title: 'Guides',
    links: [
      { label: 'Valoriser une entreprise', href: '/guide/valorisation-entreprise' },
      { label: 'Methodes de valorisation', href: '/guide/methodes-valorisation' },
      { label: 'Valorisation restaurant', href: '/guide/valorisation-restaurant' },
      { label: 'Valorisation SaaS', href: '/guide/valorisation-saas' },
      { label: 'Valorisation commerce', href: '/guide/valorisation-commerce' },
      { label: 'Valorisation PME industrielle', href: '/guide/valorisation-pme-industrielle' },
      { label: 'Valorisation startup', href: '/guide/valorisation-startup' },
      { label: 'Valorisation cabinet comptable', href: '/guide/valorisation-cabinet-comptable' },
    ],
  },
  {
    title: 'Compte',
    links: [
      { label: 'Connexion', href: '/connexion' },
      { label: 'Inscription', href: '/inscription' },
      { label: 'Mon compte', href: '/compte' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Mentions legales', href: '/mentions-legales' },
      { label: 'CGU', href: '/cgu' },
      { label: 'Confidentialite', href: '/privacy' },
    ],
  },
]

interface FooterProps {
  className?: string
}

export function Footer({ className = '' }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      className={`bg-[var(--bg-inverted)] text-white ${className}`}
    >
      <div className="max-w-[var(--content-max-width)] mx-auto px-8 py-16">
        {/* Top Section */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Logo & Description */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 bg-[var(--accent)] rounded-[var(--radius-md)] flex items-center justify-center text-white font-bold text-[16px]">
                E
              </div>
              <span className="text-[20px] font-bold text-white">
                Eval<span className="text-[var(--accent)]">Up</span>
              </span>
            </Link>
            <p className="text-[14px] text-white/60 max-w-xs leading-relaxed">
              Plateforme de valorisation d&apos;entreprise basée sur l&apos;IA. Obtenez une estimation fiable en quelques minutes.
            </p>
          </div>

          {/* Links Sections */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h4 className="text-[12px] font-semibold uppercase tracking-wide text-white/40 mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[14px] text-white/60 hover:text-white transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[13px] text-white/40">
            © {currentYear} EvalUp by POSSE. Tous droits réservés.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://www.linkedin.com/company/evalup-fr"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-[var(--radius-sm)] transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <a
              href="https://x.com/evalup_fr"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-[var(--radius-sm)] transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
