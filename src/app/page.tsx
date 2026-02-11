import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { Hero } from '../components/landing/Hero'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* App Preview / Demo */}
      <section className="pb-16">
        <div className="max-w-[900px] mx-auto px-8 relative">
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-xl)] overflow-hidden">
            {/* Browser toolbar */}
            <div className="flex items-center justify-between px-5 py-3 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF605C]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD44]" />
                <div className="w-3 h-3 rounded-full bg-[#00CA4E]" />
              </div>
              <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
                <span className="text-[var(--success)]">&#128274;</span>
                app.evalup.fr
              </div>
              <div className="w-12" />
            </div>

            {/* App mockup content */}
            <div className="flex min-h-[420px]">
              {/* Mini sidebar */}
              <div className="w-[200px] border-r border-[var(--border)] bg-[var(--bg-secondary)] p-4 hidden md:block">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-[var(--accent)] rounded-md flex items-center justify-center text-white text-[10px] font-bold">E</div>
                  <span className="text-[14px] font-bold text-[var(--text-primary)]">EvalUp</span>
                </div>
                <button className="w-full bg-[var(--accent)] text-white text-[12px] font-semibold py-2 px-3 rounded-[var(--radius-md)] mb-4 flex items-center justify-center gap-1">
                  <span>+</span> Nouvelle evaluation
                </button>
                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2 px-1">Recentes</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 p-2 rounded-md bg-[var(--accent-light)] text-[var(--accent)]">
                    <div className="w-6 h-6 rounded bg-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center">W</div>
                    <span className="text-[12px] font-semibold truncate">WEBCRAFT AGENCY</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-md text-[var(--text-secondary)]">
                    <div className="w-6 h-6 rounded bg-[var(--bg-tertiary)] text-[10px] font-bold flex items-center justify-center">D</div>
                    <span className="text-[12px] truncate">DUPONT CONSEIL</span>
                  </div>
                </div>
              </div>

              {/* Chat area */}
              <div className="flex-1 flex flex-col">
                {/* Chat header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[14px] text-[var(--text-primary)]">WEBCRAFT AGENCY</span>
                    <span className="text-[11px] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full text-[var(--text-secondary)]">Agence web</span>
                  </div>
                  {/* Mini stepper */}
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5,6].map((s, i) => (
                      <div key={i} className="flex items-center">
                        <div className={`w-2 h-2 rounded-full ${i < 3 ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
                        {i < 5 && <div className={`w-3 h-0.5 ${i < 2 ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-5 space-y-4 overflow-hidden">
                  {/* AI message */}
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center shrink-0">E</div>
                    <div className="text-[13px] text-[var(--text-secondary)]">
                      J'ai trouve <strong className="text-[var(--text-primary)]">WEBCRAFT AGENCY</strong> via Pappers. Voici les donnees financieres :
                    </div>
                  </div>

                  {/* Data card */}
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 ml-10">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[12px] font-bold text-[var(--text-primary)]">Donnees financieres 2024</span>
                      <span className="text-[10px] font-semibold text-[var(--accent)] bg-[var(--accent-light)] px-2 py-0.5 rounded-full">Via Pappers</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-[9px] uppercase text-[var(--text-muted)] font-medium">Chiffre d'affaires</p>
                        <p className="font-mono text-[15px] font-bold text-[var(--text-primary)]">320 K&#8364;</p>
                        <p className="text-[10px] text-[var(--success)]">&#9650; +18.5%</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase text-[var(--text-muted)] font-medium">Resultat net</p>
                        <p className="font-mono text-[15px] font-bold text-[var(--text-primary)]">58 K&#8364;</p>
                        <p className="text-[10px] text-[var(--success)]">&#9650; +24.3%</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase text-[var(--text-muted)] font-medium">Effectif</p>
                        <p className="font-mono text-[15px] font-bold text-[var(--text-primary)]">5</p>
                        <p className="text-[10px] text-[var(--success)]">&#9650; +1</p>
                      </div>
                    </div>
                  </div>

                  {/* AI question */}
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center shrink-0">E</div>
                    <div className="text-[13px] text-[var(--text-secondary)]">
                      Passons aux <span className="text-[var(--accent)] font-semibold">retraitements</span>. Quel est le <strong className="text-[var(--text-primary)]">salaire annuel brut du dirigeant</strong> ?
                    </div>
                  </div>

                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="bg-[var(--accent)] text-white px-4 py-2 rounded-[var(--radius-lg)] rounded-br-sm text-[13px] max-w-[70%]">
                      Le dirigeant se verse environ 55 000&#8364; brut/an
                    </div>
                  </div>
                </div>

                {/* Input */}
                <div className="border-t border-[var(--border)] p-3 flex gap-3">
                  <input
                    type="text"
                    placeholder="Ecris ta reponse..."
                    className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-full px-4 py-2 text-[13px] outline-none"
                    readOnly
                  />
                  <button className="w-9 h-9 bg-[var(--accent)] text-white rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Floating valuation card */}
          <div className="absolute -right-4 top-1/3 bg-[var(--bg-primary)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] p-4 animate-bounce hidden lg:block">
            <p className="text-[11px] text-[var(--text-muted)] mb-1">Valorisation estimée</p>
            <p className="font-mono text-[18px] font-bold text-[var(--accent)]">380K€ - 520K€</p>
          </div>
        </div>
      </section>

      {/* Data Sources Logos */}
      <section className="py-12 border-b border-[var(--border)]">
        <div className="max-w-[var(--content-max-width)] mx-auto px-8 text-center">
          <p className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-6">
            Sources de donnees fiables
          </p>
          <div className="flex items-center justify-center gap-12 flex-wrap opacity-50">
            {['Pappers', 'INSEE', 'Infogreffe', 'Banque de France', 'BODACC'].map((name) => (
              <span key={name} className="text-[18px] font-bold text-[var(--text-muted)]">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 bg-[var(--bg-secondary)]">
        <div className="max-w-[var(--content-max-width)] mx-auto px-8">
          <div className="text-center mb-16">
            <Badge variant="accent" className="mb-4">
              Simple et rapide
            </Badge>
            <h2 className="section-title">Comment ca marche</h2>
            <p className="section-desc mx-auto">
              En trois etapes simples, obtenez une estimation professionnelle de la valeur de votre entreprise.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Identifiez votre entreprise',
                description: 'Entrez simplement votre numero SIREN. Nous recuperons automatiquement les donnees publiques disponibles.',
                tag: 'Automatique',
              },
              {
                step: '02',
                title: 'Repondez aux questions',
                description: "L'IA vous pose des questions ciblees pour affiner l'analyse. Un echange simple et guide.",
                tag: '~10 questions',
              },
              {
                step: '03',
                title: 'Obtenez votre valorisation',
                description: 'Recevez une estimation detaillee avec plusieurs methodes de calcul et un rapport telechargeable.',
                tag: 'PDF inclus',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[var(--radius-xl)] p-8 hover:shadow-[var(--shadow-lg)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 mb-5 bg-[var(--accent-light)] text-[var(--accent)] rounded-[var(--radius-md)] flex items-center justify-center font-mono font-bold text-[16px]">
                  {item.step}
                </div>
                <h3 className="text-[18px] font-bold text-[var(--text-primary)] mb-3">
                  {item.title}
                </h3>
                <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-4">
                  {item.description}
                </p>
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--success)] bg-[var(--success-light)] px-3 py-1 rounded-full">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  {item.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-[var(--content-max-width)] mx-auto px-8">
          <div className="text-center mb-16">
            <Badge variant="accent" className="mb-4">
              Fonctionnalites
            </Badge>
            <h2 className="section-title">Tout ce dont vous avez besoin</h2>
            <p className="section-desc mx-auto">
              Des outils professionnels accessibles a tous pour une valorisation precise et fiable.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid md:grid-cols-12 gap-5">
            {/* Large card - Valorisation */}
            <div className="md:col-span-7 bg-[var(--bg-primary)] border border-[var(--border)] rounded-[var(--radius-xl)] p-8">
              <div className="w-11 h-11 bg-[var(--accent-light)] text-[var(--accent)] rounded-[var(--radius-md)] flex items-center justify-center text-[20px] mb-5">
                &#128202;
              </div>
              <h3 className="text-[18px] font-bold text-[var(--text-primary)] mb-2">
                3 methodes de valorisation
              </h3>
              <p className="text-[14px] text-[var(--text-secondary)] mb-6">
                DCF, multiples sectoriels et approche patrimoniale. Chaque methode est ponderee pour une fourchette realiste.
              </p>
              <div className="bg-gradient-to-br from-[#1A2E4F] to-[var(--accent)] rounded-[var(--radius-lg)] p-6 text-center text-white">
                <p className="text-[11px] uppercase tracking-wide opacity-70">Valorisation estimee</p>
                <p className="font-mono text-[28px] font-bold my-2">380 K&#8364; - 520 K&#8364;</p>
                <p className="text-[12px] opacity-60">Fourchette basee sur 3 methodes</p>
              </div>
            </div>

            {/* Narrow card - Donnees */}
            <div className="md:col-span-5 bg-[var(--bg-primary)] border border-[var(--border)] rounded-[var(--radius-xl)] p-8">
              <div className="w-11 h-11 bg-[var(--success-light)] text-[var(--success)] rounded-[var(--radius-md)] flex items-center justify-center text-[20px] mb-5">
                &#9889;
              </div>
              <h3 className="text-[18px] font-bold text-[var(--text-primary)] mb-2">
                Donnees en temps reel
              </h3>
              <p className="text-[14px] text-[var(--text-secondary)] mb-5">
                Connexion directe aux bases officielles. Bilans et comptes de resultat importes automatiquement.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Pappers', color: '#059669' },
                  { name: 'INSEE', color: '#2563EB' },
                  { name: 'Infogreffe', color: '#7C3AED' },
                  { name: 'BODACC', color: '#D97706' },
                ].map((source) => (
                  <span key={source.name} className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-full text-[13px] text-[var(--text-secondary)]">
                    <span className="w-2 h-2 rounded-full" style={{ background: source.color }} />
                    {source.name}
                  </span>
                ))}
              </div>
            </div>

            {/* 3 small cards */}
            <div className="md:col-span-4 bg-[var(--bg-primary)] border border-[var(--border)] rounded-[var(--radius-xl)] p-6">
              <div className="text-[24px] mb-3">&#128196;</div>
              <h3 className="text-[16px] font-bold text-[var(--text-primary)] mb-1">Rapport PDF pro</h3>
              <p className="text-[13px] text-[var(--text-secondary)]">15+ pages avec graphiques et analyses</p>
            </div>

            <div className="md:col-span-4 bg-[var(--bg-primary)] border border-[var(--border)] rounded-[var(--radius-xl)] p-6">
              <div className="text-[24px] mb-3">&#129302;</div>
              <h3 className="text-[16px] font-bold text-[var(--text-primary)] mb-1">IA conversationnelle</h3>
              <p className="text-[13px] text-[var(--text-secondary)]">Dialoguez naturellement, sans formulaires</p>
            </div>

            <div className="md:col-span-4 bg-[var(--bg-primary)] border border-[var(--border)] rounded-[var(--radius-xl)] p-6">
              <div className="text-[24px] mb-3">&#128200;</div>
              <h3 className="text-[16px] font-bold text-[var(--text-primary)] mb-1">Comparables</h3>
              <p className="text-[13px] text-[var(--text-secondary)]">Transactions recentes de votre secteur</p>
            </div>
          </div>

          {/* Download example report */}
          <div className="mt-12 text-center">
            <p className="text-[14px] text-[var(--text-secondary)] mb-4">
              Decouvrez un exemple de rapport sur une entreprise fictive
            </p>
            <Button variant="outline" size="lg" asChild>
              <a href="/exemple-rapport-evalup.pdf" download>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Telecharger un exemple de rapport
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-24 bg-[var(--bg-secondary)]">
        <div className="max-w-[var(--content-max-width)] mx-auto px-8">
          <div className="text-center mb-16">
            <Badge variant="accent" className="mb-4">
              Ils nous font confiance
            </Badge>
            <h2 className="section-title">Utilise par des dirigeants dans toute la France</h2>
            <p className="section-desc mx-auto">
              Que ce soit pour une cession, une levee de fonds ou simplement connaitre la valeur de leur entreprise.
            </p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              { value: '2 400+', label: 'Evaluations realisees' },
              { value: '8 min', label: 'Temps moyen par evaluation' },
              { value: '4.8/5', label: 'Note de satisfaction' },
            ].map((stat, i) => (
              <div key={i} className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[var(--radius-xl)] p-8 text-center">
                <p className="font-mono text-[36px] font-bold text-[var(--accent)]">{stat.value}</p>
                <p className="text-[14px] text-[var(--text-secondary)] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                text: "J'ai obtenu une valorisation coherente en moins de 10 minutes. Le rapport PDF a impressionne mon banquier.",
                name: 'Pierre M.',
                role: 'Dirigeant - Menuiserie, 12 salaries',
                color: 'from-[#2563EB] to-[#6366F1]',
              },
              {
                text: "Enfin un outil qui parle en francais et qui comprend les specificites des PME. Les retraitements sont pertinents.",
                name: 'Sophie L.',
                role: 'Expert-comptable - Cabinet independant',
                color: 'from-[#059669] to-[#10B981]',
              },
              {
                text: "Je preparais la cession de mon restaurant. EvalUp m'a donne une base solide pour negocier avec les repreneurs.",
                name: 'Marc K.',
                role: 'Restaurateur - 2 etablissements',
                color: 'from-[#D97706] to-[#F59E0B]',
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[var(--radius-xl)] p-7 hover:shadow-[var(--shadow-md)] hover:-translate-y-1 transition-all">
                <div className="text-[14px] text-yellow-400 tracking-wider mb-4">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed italic mb-5">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.color} text-white text-[13px] font-bold flex items-center justify-center`}>
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-[var(--text-primary)]">{testimonial.name}</p>
                    <p className="text-[12px] text-[var(--text-muted)]">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[var(--bg-inverted)] relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[var(--accent)] opacity-10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-[var(--content-max-width)] mx-auto px-8 text-center relative z-10">
          <h2 className="text-[32px] md:text-[42px] font-bold text-white mb-4 leading-tight">
            Pret a connaitre la valeur<br />
            <span className="bg-gradient-to-r from-[#60A5FA] to-[#A78BFA] bg-clip-text text-transparent">
              de votre entreprise ?
            </span>
          </h2>
          <p className="text-[17px] text-white/60 max-w-lg mx-auto mb-10">
            Premiere evaluation gratuite. Resultats en 10 minutes. Rapport PDF professionnel inclus.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="white" size="lg" asChild>
              <Link href="/diagnostic">
                Commencer gratuitement &#8594;
              </Link>
            </Button>
            <Button variant="ghost-dark" size="lg" asChild>
              <a href="/exemple-rapport-evalup.pdf" download>
                Voir un exemple
              </a>
            </Button>
          </div>
          <p className="text-[13px] text-white/40 mt-6 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Vos donnees sont securisees et ne sont jamais partagees
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
