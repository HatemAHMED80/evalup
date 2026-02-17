import Link from 'next/link'

export default function ValorisationSaaSPage() {
  return (
    <>
      <p className="text-[var(--text-muted)] text-sm mb-2">Guide mis a jour en fevrier 2025</p>
      <h1>Valorisation d&apos;une entreprise SaaS : multiples ARR, metriques et methodes</h1>

      <p>
        <strong>Une entreprise SaaS (Software as a Service) se valorise entre 3x et 15x son ARR</strong> (Annual Recurring Revenue), selon la croissance, le churn et la Net Revenue Retention. Les SaaS a forte croissance (&gt; 100% YoY) peuvent atteindre 20x+ en serie B/C.
      </p>

      <blockquote>
        <p>
          <strong>Repere :</strong> un SaaS B2B avec 1M&#8364; d&apos;ARR, 60% de croissance annuelle et un churn &lt; 3% se valorise typiquement entre 6x et 10x son ARR, soit 6 a 10 M&#8364; en pre-money (serie A France, 2024).
        </p>
      </blockquote>

      <h2>Pourquoi les SaaS sont valorises differemment ?</h2>

      <p>
        Contrairement aux PME traditionnelles, les SaaS sont rarement rentables en phase de croissance. Ils investissent massivement en acquisition client (CAC) avec l&apos;objectif de construire un <strong>revenu recurrent previsible</strong>. La valorisation repose donc sur le revenu recurrent et ses metriques de qualite, pas sur l&apos;EBITDA.
      </p>

      <h2>Les metriques cles de valorisation SaaS</h2>

      <table>
        <thead>
          <tr>
            <th>Metrique</th>
            <th>Definition</th>
            <th>Benchmark (bon)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>ARR</strong></td>
            <td>Annual Recurring Revenue = MRR x 12</td>
            <td>&gt; 1M&#8364; pour serie A</td>
          </tr>
          <tr>
            <td><strong>Croissance YoY</strong></td>
            <td>Taux de croissance de l&apos;ARR sur 12 mois</td>
            <td>&gt; 100% (seed), &gt; 60% (A)</td>
          </tr>
          <tr>
            <td><strong>Churn mensuel</strong></td>
            <td>% de revenus perdus chaque mois</td>
            <td>&lt; 2% (B2B), &lt; 5% (B2C)</td>
          </tr>
          <tr>
            <td><strong>NRR</strong></td>
            <td>Net Revenue Retention : expansion - churn sur la base existante</td>
            <td>&gt; 110% (excellent)</td>
          </tr>
          <tr>
            <td><strong>LTV/CAC</strong></td>
            <td>Lifetime Value / Cout d&apos;Acquisition Client</td>
            <td>&gt; 3x</td>
          </tr>
          <tr>
            <td><strong>Payback period</strong></td>
            <td>Mois pour recuperer le CAC</td>
            <td>&lt; 18 mois</td>
          </tr>
          <tr>
            <td><strong>Marge brute</strong></td>
            <td>CA - COGS (hebergement, support)</td>
            <td>&gt; 70%</td>
          </tr>
        </tbody>
      </table>

      <h2>La Rule of 40</h2>

      <p>
        La <strong>Rule of 40</strong> est le benchmark le plus utilise par les investisseurs SaaS. Le principe : la somme de la croissance de l&apos;ARR (%) et de la marge operationnelle (%) doit depasser 40%.
      </p>

      <p><strong>Formule : Croissance ARR (%) + Marge EBITDA (%) &ge; 40%</strong></p>

      <p>Exemples :</p>
      <ul>
        <li>Croissance +80%, marge -30% &#8594; score 50 &#10003; (profil hypercroissance)</li>
        <li>Croissance +30%, marge +15% &#8594; score 45 &#10003; (profil equilibre)</li>
        <li>Croissance +20%, marge +5% &#8594; score 25 &#10007; (sous le seuil)</li>
      </ul>

      <p>
        Un score Rule of 40 &gt; 40 justifie un multiple EV/Revenue superieur. Chaque point au-dessus de 40 ajoute environ 0,3x au multiple.
      </p>

      <h2>Multiples de valorisation SaaS (France, 2024)</h2>

      <table>
        <thead>
          <tr>
            <th>Stade</th>
            <th>ARR typique</th>
            <th>Multiple EV/ARR</th>
            <th>Valorisation indicative</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Pre-seed</td><td>&lt; 100k&#8364;</td><td>N/A (equipe + marche)</td><td>500k - 2M&#8364;</td></tr>
          <tr><td>Seed</td><td>100k - 500k&#8364;</td><td>8x - 15x</td><td>1M - 5M&#8364;</td></tr>
          <tr><td>Serie A</td><td>500k - 2M&#8364;</td><td>6x - 12x</td><td>5M - 20M&#8364;</td></tr>
          <tr><td>Serie B</td><td>2M - 10M&#8364;</td><td>5x - 10x</td><td>15M - 80M&#8364;</td></tr>
          <tr><td>SaaS rentable (PME)</td><td>500k - 5M&#8364;</td><td>3x - 6x</td><td>1,5M - 30M&#8364;</td></tr>
        </tbody>
      </table>

      <p className="text-sm text-[var(--text-muted)]">
        Source : analyses de levees de fonds francaises (Dealroom, Crunchbase), ajustees pour le marche europeen.
      </p>

      <h2>Les methodes de valorisation SaaS</h2>

      <h3>1. Multiple d&apos;ARR (methode principale)</h3>

      <p>
        <strong>VE = ARR x Multiple</strong>. Le multiple depend principalement de la croissance et du churn. Un SaaS avec une croissance &gt; 100% et un churn &lt; 2% peut justifier un multiple de 10-15x.
      </p>

      <h3>2. DCF (Discounted Cash Flow)</h3>

      <p>
        La methode DCF modelise les flux de tresorerie futurs en projetant la croissance de l&apos;ARR, le taux de conversion en FCF et un taux d&apos;actualisation eleve (15-25% pour un SaaS early-stage). Elle est utilisee en complement du multiple d&apos;ARR, surtout pour les series B+.
      </p>

      <h3>3. Methode des comparables de levees</h3>

      <p>
        On compare le SaaS a des levees recentes dans le meme vertical (fintech, healthtech, HRtech, etc.) et au meme stade. C&apos;est la methode la plus pragmatique pour calibrer une pre-money.
      </p>

      <h2>Facteurs qui augmentent le multiple</h2>

      <ul>
        <li><strong>NRR &gt; 120%</strong> : les clients existants generent de la croissance organique (upsell)</li>
        <li><strong>Marge brute &gt; 80%</strong> : peu de COGS, forte scalabilite</li>
        <li><strong>Churn &lt; 1% mensuel</strong> : forte retention, produit indispensable</li>
        <li><strong>Marche TAM &gt; 1 Md&#8364;</strong> : potentiel de croissance important</li>
        <li><strong>Revenus contractuels</strong> : contrats annuels ou pluriannuels (vs mensuel)</li>
        <li><strong>Pas de dependance a un canal</strong> : acquisition diversifiee (SEO + outbound + partenariats)</li>
      </ul>

      <h2>Facteurs qui diminuent le multiple</h2>

      <ul>
        <li><strong>Churn &gt; 5% mensuel</strong> : le SaaS perd plus de clients qu&apos;il n&apos;en gagne (leaky bucket)</li>
        <li><strong>Concentration clients</strong> : 1 client &gt; 20% de l&apos;ARR = risque</li>
        <li><strong>Revenu non recurrent</strong> : setup fees, services, consulting &gt; 30% du CA</li>
        <li><strong>Burn rate eleve</strong> : CAC payback &gt; 24 mois</li>
        <li><strong>Marche niche</strong> : TAM &lt; 100M&#8364; = plafond de valorisation</li>
      </ul>

      <h2>Exemple complet de valorisation</h2>

      <p>SaaS B2B en HRtech, France, en levee Serie A :</p>

      <ul>
        <li>MRR : 80 000 &#8364; &#8594; ARR : 960 000 &#8364;</li>
        <li>Croissance YoY : +90%</li>
        <li>Churn mensuel : 1,5%</li>
        <li>NRR : 115%</li>
        <li>LTV/CAC : 4,2x</li>
        <li>Marge brute : 78%</li>
        <li>Rule of 40 : 90% + (-35%) = 55 &#10003;</li>
      </ul>

      <table>
        <thead>
          <tr>
            <th>Methode</th>
            <th>Calcul</th>
            <th>Valorisation</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Multiple ARR (8x)</td><td>960k x 8</td><td>7 680 000 &#8364;</td></tr>
          <tr><td>Multiple ARR (10x)</td><td>960k x 10</td><td>9 600 000 &#8364;</td></tr>
          <tr><td>Comparables Serie A France</td><td>Mediane HRtech</td><td>8 000 000 - 10 000 000 &#8364;</td></tr>
        </tbody>
      </table>

      <p>
        <strong>Fourchette pre-money : 8 - 10 M&#8364;</strong>. Le profil (forte croissance, bon NRR, Rule of 40 &gt; 40) justifie le haut de la fourchette.
      </p>

      <h2>SaaS rentable (PME) vs SaaS en levee</h2>

      <p>
        Un SaaS deja rentable qui ne leve pas de fonds se valorise differemment : on utilise un <strong>multiple EV/EBITDA de 8x a 12x</strong> (plus eleve qu&apos;une PME classique grace a la recurrence et la scalabilite), en complement du multiple d&apos;ARR.
      </p>

      <h2>Liens utiles</h2>

      <ul>
        <li><Link href="/guide/valorisation-startup">Valorisation de startup : methodes pre-revenue</Link></li>
        <li><Link href="/guide/valorisation-entreprise">Guide general de la valorisation d&apos;entreprise</Link></li>
        <li><Link href="/guide/methodes-valorisation">Les 5 methodes de valorisation expliquees</Link></li>
      </ul>

      <div className="mt-12 p-6 bg-[var(--accent-light)] border border-[var(--accent)]/20 rounded-[var(--radius-xl)] text-center">
        <p className="text-[var(--text-primary)] font-semibold mb-2">Valorisez votre SaaS en 10 minutes</p>
        <p className="text-[var(--text-secondary)] text-sm mb-4">Diagnostic gratuit + rapport professionnel de 28 pages</p>
        <Link
          href="/diagnostic"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-[var(--radius-lg)] font-medium hover:bg-[var(--accent-hover)] transition-colors"
        >
          Lancer le diagnostic gratuit
        </Link>
      </div>
    </>
  )
}
