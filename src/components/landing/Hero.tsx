import Link from 'next/link'
import { Badge } from '../ui/Badge'

export function Hero() {
  return (
    <section className="relative flex items-center pt-[var(--nav-height)] pb-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[var(--accent-subtle)] via-transparent to-transparent" />

      {/* Glow effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -z-10 w-[800px] h-[400px] bg-[var(--accent)] opacity-[0.03] blur-[120px] rounded-full" />

      <div className="max-w-[var(--content-max-width)] mx-auto px-8 w-full">
        <div className="max-w-3xl mx-auto text-center pt-16 pb-8">
          {/* Badge */}
          <Badge
            variant="accent"
            size="md"
            className="mb-6 animate-fade-up"
            icon={
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          >
            Propulsé par l&apos;IA
          </Badge>

          {/* Title */}
          <h1 className="text-[var(--text-4xl)] md:text-[56px] font-extrabold leading-[1.1] tracking-tight mb-6 animate-fade-up delay-1">
            Estimez la valeur de votre entreprise{' '}
            <span className="text-gradient">en quelques minutes</span>
          </h1>

          {/* Subtitle */}
          <p className="text-[var(--text-lg)] text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 animate-fade-up delay-2">
            EvalUp utilise l&apos;intelligence artificielle pour analyser votre entreprise et vous fournir
            une estimation fiable, basée sur les mêmes méthodes que les experts en valorisation.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up delay-3">
            <Link
              href="/app"
              className="inline-flex items-center justify-center px-7 py-3.5 text-[15px] font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-150"
            >
              Commencer gratuitement
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a
              href="/exemple-rapport-evalup.pdf"
              download
              className="inline-flex items-center justify-center px-7 py-3.5 text-[15px] font-semibold bg-transparent text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)] rounded-[var(--radius-lg)] transition-all duration-150"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Télécharger un exemple
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
