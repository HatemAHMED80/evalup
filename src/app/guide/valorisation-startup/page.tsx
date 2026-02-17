import Link from 'next/link'

export default function ValorisationStartupPage() {
  return (
    <>
      <p className="text-[var(--text-muted)] text-sm mb-2">Guide mis a jour en fevrier 2025</p>
      <h1>Valorisation de startup : methodes pre-revenue, DCF et comparables de levees</h1>

      <p>
        <strong>Valoriser une startup sans revenus ou en early-stage</strong> est l&apos;exercice le plus subjectif de la finance d&apos;entreprise. Sans historique financier, la valorisation repose sur le potentiel de marche, l&apos;equipe, la traction et les comparables de levees recentes.
      </p>

      <blockquote>
        <p>
          <strong>Ordres de grandeur en France (2024) :</strong> pre-seed 500k - 2M&#8364;, seed 1,5M - 5M&#8364;, serie A 5M - 20M&#8364; (pre-money). Ces fourchettes varient fortement selon le secteur, la traction et le marche.
        </p>
      </blockquote>

      <h2>Les methodes de valorisation pre-revenue</h2>

      <h3>1. Methode Berkus</h3>

      <p>
        Developpee par l&apos;investisseur Dave Berkus, cette methode attribue une valeur a <strong>5 facteurs qualitatifs</strong>, chacun pouvant ajouter jusqu&apos;a 500 000 &#8364; a la valorisation :
      </p>

      <table>
        <thead>
          <tr>
            <th>Facteur</th>
            <th>Question</th>
            <th>Valeur max</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Idee / concept</td><td>Le probleme est-il reel et important ?</td><td>500 000 &#8364;</td></tr>
          <tr><td>Prototype / technologie</td><td>Existe-t-il un produit fonctionnel ?</td><td>500 000 &#8364;</td></tr>
          <tr><td>Equipe</td><td>L&apos;equipe a-t-elle l&apos;experience pour executer ?</td><td>500 000 &#8364;</td></tr>
          <tr><td>Relations strategiques</td><td>Partenariats, clients pilotes, distribution ?</td><td>500 000 &#8364;</td></tr>
          <tr><td>Premieres ventes / traction</td><td>Y a-t-il une preuve de demande ?</td><td>500 000 &#8364;</td></tr>
        </tbody>
      </table>

      <p>
        <strong>Valorisation maximale Berkus : 2,5M&#8364;</strong>. Cette methode est adaptee aux startups pre-revenue en phase de pre-seed ou seed.
      </p>

      <h3>2. Methode Scorecard (Bill Payne)</h3>

      <p>
        La methode Scorecard compare la startup a la <strong>valorisation mediane des deals seed</strong> dans la meme region, puis ajuste avec des coefficients :
      </p>

      <table>
        <thead>
          <tr>
            <th>Critere</th>
            <th>Poids</th>
            <th>Fourchette d&apos;ajustement</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Equipe dirigeante</td><td>30%</td><td>0,5x - 1,5x</td></tr>
          <tr><td>Taille du marche (TAM)</td><td>25%</td><td>0,5x - 1,5x</td></tr>
          <tr><td>Produit / technologie</td><td>15%</td><td>0,5x - 1,5x</td></tr>
          <tr><td>Environnement concurrentiel</td><td>10%</td><td>0,5x - 1,5x</td></tr>
          <tr><td>Canaux de vente / marketing</td><td>10%</td><td>0,5x - 1,5x</td></tr>
          <tr><td>Besoin d&apos;investissement supplementaire</td><td>5%</td><td>0,5x - 1,5x</td></tr>
          <tr><td>Autres</td><td>5%</td><td>0,5x - 1,5x</td></tr>
        </tbody>
      </table>

      <p>
        Valorisation mediane seed en France (2024) : environ <strong>2,5M&#8364;</strong> pre-money. La methode Scorecard ajuste ce chiffre a la hausse ou a la baisse selon le profil.
      </p>

      <h3>3. DCF adapte (pour startups avec traction)</h3>

      <p>
        Le DCF peut etre utilise pour les startups ayant des <strong>premiers revenus</strong> et une trajectoire modelisable. Le taux d&apos;actualisation est tres eleve (25-40%) pour refleter le risque :
      </p>

      <ul>
        <li>Pre-seed : WACC 35-50% (taux de mortalite &gt; 90%)</li>
        <li>Seed avec traction : WACC 25-35%</li>
        <li>Serie A : WACC 20-30%</li>
        <li>Serie B : WACC 15-25%</li>
      </ul>

      <h3>4. Methode des comparables de levees</h3>

      <p>
        La methode la plus pragmatique : comparer avec des <strong>levees recentes</strong> dans le meme vertical, au meme stade, dans la meme geographie. Les bases de donnees (Dealroom, Crunchbase, Eldorado) fournissent ces comparables.
      </p>

      <h2>Valorisation par stade de maturite</h2>

      <table>
        <thead>
          <tr>
            <th>Stade</th>
            <th>Typiquement</th>
            <th>Valorisation pre-money (France)</th>
            <th>Methode privilegiee</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Ideation</td><td>Idee + equipe</td><td>300k - 1M&#8364;</td><td>Berkus</td></tr>
          <tr><td>Pre-seed</td><td>MVP + premiers utilisateurs</td><td>500k - 2M&#8364;</td><td>Berkus + Scorecard</td></tr>
          <tr><td>Seed</td><td>Produit lance + premières ventes</td><td>1,5M - 5M&#8364;</td><td>Scorecard + Comparables</td></tr>
          <tr><td>Serie A</td><td>Product-market fit + croissance</td><td>5M - 20M&#8364;</td><td>Comparables + DCF</td></tr>
          <tr><td>Serie B</td><td>Scaling + unit economics prouves</td><td>15M - 80M&#8364;</td><td>Multiple ARR + DCF</td></tr>
        </tbody>
      </table>

      <h2>Les facteurs de valorisation d&apos;une startup</h2>

      <h3>Facteurs positifs (prime)</h3>

      <ul>
        <li><strong>Equipe fondatrice d&apos;exception</strong> : serial entrepreneurs, expertise technique rare, reseau</li>
        <li><strong>TAM &gt; 1 Md&#8364;</strong> : marche suffisamment grand pour justifier un venture return</li>
        <li><strong>Traction prouvee</strong> : croissance MoM &gt; 15%, rétention elevee, NPS &gt; 50</li>
        <li><strong>Moat technologique</strong> : brevet, algorithme proprietaire, effet de reseau</li>
        <li><strong>Marche en tendance</strong> : IA, climat, sante = appetit investisseur</li>
        <li><strong>Premiers clients entreprise</strong> : contrats signes avec des references (CAC40, scale-ups)</li>
        <li><strong>Unit economics positifs</strong> : LTV/CAC &gt; 3x meme a petite echelle</li>
      </ul>

      <h3>Facteurs negatifs (decote)</h3>

      <ul>
        <li><strong>Solo founder</strong> : risque d&apos;execution plus eleve (-10 a -30%)</li>
        <li><strong>Marche niche</strong> : TAM &lt; 100M&#8364; = peu d&apos;interet VC</li>
        <li><strong>Pas de traction mesurable</strong> : que des intentions, pas d&apos;usage</li>
        <li><strong>Capital-intensif</strong> : besoin de hardware, d&apos;infrastructure physique</li>
        <li><strong>Complexite reglementaire</strong> : fintech, healthtech = time-to-market plus long</li>
        <li><strong>Cap table deja diluee</strong> : trop de tours precedents a des conditions defavorables</li>
      </ul>

      <h2>Exemple complet : valorisation seed</h2>

      <p>SaaS B2B en climatech, 2 cofondateurs :</p>

      <ul>
        <li>MRR : 8 000 &#8364; (premiers clients)</li>
        <li>Croissance MoM : +25%</li>
        <li>Equipe : 2 cofondateurs (1 tech CTO, 1 business CEO), 2 ingenieurs</li>
        <li>Marche : TAM 2 Md&#8364; (reporting ESG PME)</li>
        <li>Produit : MVP lance depuis 4 mois, 15 clients payants</li>
      </ul>

      <h3>Methode Berkus</h3>
      <ul>
        <li>Idee : 400 000 &#8364; (probleme reel, marche en croissance)</li>
        <li>Prototype : 450 000 &#8364; (produit fonctionnel, 15 clients)</li>
        <li>Equipe : 350 000 &#8364; (bonne complementarite, premiere startup)</li>
        <li>Relations : 200 000 &#8364; (quelques partenariats en cours)</li>
        <li>Traction : 300 000 &#8364; (8k MRR, +25% MoM)</li>
        <li><strong>Total Berkus : 1 700 000 &#8364;</strong></li>
      </ul>

      <h3>Methode Scorecard</h3>
      <ul>
        <li>Mediane seed France : 2 500 000 &#8364;</li>
        <li>Ajustement equipe (30%, score 0,9) : -75 000 &#8364;</li>
        <li>Ajustement marche (25%, score 1,3) : +187 500 &#8364;</li>
        <li>Ajustement produit (15%, score 1,1) : +37 500 &#8364;</li>
        <li><strong>Total Scorecard : ~2 650 000 &#8364;</strong></li>
      </ul>

      <p>
        <strong>Fourchette pre-money : 1,7M - 2,7M&#8364;</strong>. Pour une levee seed de 500k&#8364;, cela implique une dilution de 16% a 23%.
      </p>

      <h2>La dilution : le vrai enjeu</h2>

      <p>
        La valorisation pre-money determine la <strong>dilution</strong> des fondateurs. Le calcul est simple :
      </p>

      <p><strong>Dilution = Montant leve / (Pre-money + Montant leve)</strong></p>

      <p>Benchmarks de dilution acceptables :</p>
      <ul>
        <li>Pre-seed : 10% - 15%</li>
        <li>Seed : 15% - 25%</li>
        <li>Serie A : 20% - 30%</li>
        <li>Serie B : 15% - 25%</li>
      </ul>

      <p>
        Les fondateurs doivent conserver &gt; 50% apres la serie A pour maintenir l&apos;alignement des interets et la motivation.
      </p>

      <h2>Liens utiles</h2>

      <ul>
        <li><Link href="/guide/valorisation-saas">Valorisation SaaS : multiples ARR et metriques</Link></li>
        <li><Link href="/guide/valorisation-entreprise">Guide general de la valorisation d&apos;entreprise</Link></li>
        <li><Link href="/guide/methodes-valorisation">Les 5 methodes de valorisation expliquees</Link></li>
      </ul>

      <div className="mt-12 p-6 bg-[var(--accent-light)] border border-[var(--accent)]/20 rounded-[var(--radius-xl)] text-center">
        <p className="text-[var(--text-primary)] font-semibold mb-2">Valorisez votre startup en 10 minutes</p>
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
