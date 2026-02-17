import Link from 'next/link'

export default function MethodesValorisationPage() {
  return (
    <>
      <p className="text-[var(--text-muted)] text-sm mb-2">Guide mis a jour en fevrier 2025</p>
      <h1>Les 5 methodes de valorisation d&apos;entreprise</h1>

      <p>
        Valoriser une entreprise necessite d&apos;utiliser <strong>plusieurs methodes complementaires</strong> pour obtenir une fourchette de prix fiable. Voici les 5 methodes principales utilisees en France, avec des exemples chiffres pour chacune.
      </p>

      <blockquote>
        <p>
          <strong>Principe cle :</strong> aucune methode n&apos;est parfaite seule. Un evaluateur professionnel croise toujours au moins 2 ou 3 methodes pour trianguler la valeur.
        </p>
      </blockquote>

      <h2>1. Multiple d&apos;EBITDA — La methode de reference pour les PME</h2>

      <h3>Principe</h3>

      <p>
        L&apos;EBITDA (Earnings Before Interest, Taxes, Depreciation and Amortization) mesure la <strong>capacite beneficiaire operationnelle</strong> de l&apos;entreprise, independamment de sa structure financiere et de sa politique d&apos;amortissement.
      </p>

      <p>
        On multiplie l&apos;EBITDA retraite par un <strong>multiple sectoriel</strong> pour obtenir la Valeur d&apos;Entreprise (VE).
      </p>

      <h3>Formule</h3>

      <p><strong>VE = EBITDA retraite x Multiple EV/EBITDA du secteur</strong></p>

      <h3>Exemple chiffre</h3>

      <p>Une entreprise de services informatiques :</p>
      <ul>
        <li>CA : 2 000 000 &#8364;</li>
        <li>Resultat d&apos;exploitation : 250 000 &#8364;</li>
        <li>Dotations aux amortissements : 50 000 &#8364;</li>
        <li>EBITDA comptable : 300 000 &#8364;</li>
        <li>Retraitement salaire dirigeant : -40 000 &#8364; (sous-paye de 40k vs marche)</li>
        <li><strong>EBITDA retraite : 260 000 &#8364;</strong></li>
        <li>Multiple sectoriel (IT Services, Damodaran) : 6,5x</li>
        <li><strong>Valeur d&apos;Entreprise : 260 000 x 6,5 = 1 690 000 &#8364;</strong></li>
      </ul>

      <h3>Quand l&apos;utiliser</h3>

      <p>
        Pour toute entreprise rentable avec un historique de 3+ ans. C&apos;est la methode privilegiee par les fonds d&apos;investissement et les cabinets M&amp;A en France.
      </p>

      <h3>Multiples sectoriels de reference (France, 2024)</h3>

      <table>
        <thead>
          <tr>
            <th>Secteur</th>
            <th>Multiple EV/EBITDA</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Commerce de detail</td><td>4,0x - 5,5x</td></tr>
          <tr><td>Restauration</td><td>4,5x - 6,0x</td></tr>
          <tr><td>Services aux entreprises</td><td>5,0x - 7,0x</td></tr>
          <tr><td>IT / Logiciel</td><td>7,0x - 12,0x</td></tr>
          <tr><td>Industrie / BTP</td><td>4,0x - 6,0x</td></tr>
          <tr><td>Sante / Pharmacie</td><td>8,0x - 12,0x</td></tr>
          <tr><td>Transport / Logistique</td><td>4,5x - 6,5x</td></tr>
        </tbody>
      </table>

      <p className="text-sm text-[var(--text-muted)]">
        Source : Aswath Damodaran, NYU Stern, multiples EV/EBITDA Europe. Ajustes pour les PME francaises (decote taille).
      </p>

      <h2>2. Discounted Cash Flow (DCF) — La methode intrinsèque</h2>

      <h3>Principe</h3>

      <p>
        Le DCF estime la valeur de l&apos;entreprise en <strong>actualisant ses flux de tresorerie futurs</strong>. L&apos;idee : un euro demain vaut moins qu&apos;un euro aujourd&apos;hui, car il est soumis au risque et au cout du temps.
      </p>

      <h3>Formule simplifiee</h3>

      <p><strong>VE = &#931; (FCF<sub>t</sub> / (1 + WACC)<sup>t</sup>) + Valeur terminale</strong></p>

      <p>Ou :</p>
      <ul>
        <li><strong>FCF</strong> = Free Cash Flow (flux de tresorerie disponible)</li>
        <li><strong>WACC</strong> = cout moyen pondere du capital (taux d&apos;actualisation)</li>
        <li><strong>Valeur terminale</strong> = valeur de l&apos;entreprise au-dela de la periode de projection</li>
      </ul>

      <h3>Exemple chiffre</h3>

      <p>Projection sur 5 ans d&apos;une PME en croissance :</p>

      <table>
        <thead>
          <tr>
            <th>Annee</th>
            <th>FCF</th>
            <th>Facteur d&apos;actualisation (WACC 12%)</th>
            <th>FCF actualise</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>2025</td><td>150 000 &#8364;</td><td>0,893</td><td>133 950 &#8364;</td></tr>
          <tr><td>2026</td><td>170 000 &#8364;</td><td>0,797</td><td>135 490 &#8364;</td></tr>
          <tr><td>2027</td><td>195 000 &#8364;</td><td>0,712</td><td>138 840 &#8364;</td></tr>
          <tr><td>2028</td><td>215 000 &#8364;</td><td>0,636</td><td>136 740 &#8364;</td></tr>
          <tr><td>2029</td><td>235 000 &#8364;</td><td>0,567</td><td>133 245 &#8364;</td></tr>
        </tbody>
      </table>

      <ul>
        <li>Somme des FCF actualises : 678 265 &#8364;</li>
        <li>Valeur terminale (croissance perpetuelle 2%) : 235 000 x (1,02) / (0,12 - 0,02) = 2 397 000 &#8364;</li>
        <li>Valeur terminale actualisee : 2 397 000 x 0,567 = 1 359 099 &#8364;</li>
        <li><strong>Valeur d&apos;Entreprise DCF : 678 265 + 1 359 099 = 2 037 364 &#8364;</strong></li>
      </ul>

      <h3>Quand l&apos;utiliser</h3>

      <p>
        Pour les entreprises en croissance dont la valeur depend davantage du futur. Methode de reference pour les startups financees et les entreprises technologiques.
      </p>

      <h2>3. Actif Net Reevalue (ANR) — La methode patrimoniale</h2>

      <h3>Principe</h3>

      <p>
        L&apos;ANR valorise l&apos;entreprise par la <strong>somme de ses actifs nets reevalues</strong> a leur valeur de marche. C&apos;est une approche &quot;plancher&quot; : la valeur minimale de l&apos;entreprise.
      </p>

      <h3>Formule</h3>

      <p><strong>ANR = Actifs reevalues - Dettes totales</strong></p>

      <h3>Exemple chiffre</h3>

      <p>Une entreprise industrielle :</p>
      <ul>
        <li>Immobilier (valeur de marche) : 500 000 &#8364;</li>
        <li>Equipements : 200 000 &#8364;</li>
        <li>Stocks : 150 000 &#8364;</li>
        <li>Creances clients : 100 000 &#8364;</li>
        <li>Tresorerie : 80 000 &#8364;</li>
        <li>Total actifs : 1 030 000 &#8364;</li>
        <li>Dettes financieres : -300 000 &#8364;</li>
        <li>Dettes fournisseurs : -120 000 &#8364;</li>
        <li><strong>ANR : 1 030 000 - 420 000 = 610 000 &#8364;</strong></li>
      </ul>

      <h3>Quand l&apos;utiliser</h3>

      <p>
        Pour les entreprises a forte composante patrimoniale (immobilier, industrie, holding). Souvent utilisee comme valeur plancher en complement d&apos;une methode de rendement.
      </p>

      <h2>4. Methode des comparables — Le benchmarking</h2>

      <h3>Principe</h3>

      <p>
        On compare l&apos;entreprise a des <strong>transactions recentes</strong> dans le meme secteur et la meme zone geographique. Si des entreprises similaires se sont vendues a un certain multiple, c&apos;est un indicateur du prix de marche.
      </p>

      <h3>Exemple</h3>

      <p>Un cabinet comptable avec un CA de 800 000 &#8364; :</p>
      <ul>
        <li>Transaction comparable 1 : cabinet vendu a 0,9x le CA</li>
        <li>Transaction comparable 2 : cabinet vendu a 1,1x le CA</li>
        <li>Transaction comparable 3 : cabinet vendu a 1,0x le CA</li>
        <li><strong>Valorisation indicative : 800 000 x 1,0 = 800 000 &#8364;</strong></li>
      </ul>

      <h3>Quand l&apos;utiliser</h3>

      <p>
        Quand des donnees de transactions comparables sont disponibles. Tres utilisee dans les secteurs ou les cessions sont frequentes (professions liberales, pharmacies, commerces).
      </p>

      <h2>5. Multiple de chiffre d&apos;affaires — Pour les entreprises en croissance</h2>

      <h3>Principe</h3>

      <p>
        Quand l&apos;entreprise n&apos;est pas encore rentable (ou a peine), on valorise sur la base du <strong>chiffre d&apos;affaires</strong> ou du <strong>revenu recurrent annuel (ARR)</strong> pour les SaaS.
      </p>

      <h3>Formule</h3>

      <p><strong>VE = CA (ou ARR) x Multiple EV/Revenue du secteur</strong></p>

      <h3>Exemple chiffre</h3>

      <p>Un SaaS B2B :</p>
      <ul>
        <li>MRR (Monthly Recurring Revenue) : 50 000 &#8364;</li>
        <li>ARR : 600 000 &#8364;</li>
        <li>Croissance annuelle : +80%</li>
        <li>Churn mensuel : 2%</li>
        <li>Multiple EV/Revenue (SaaS, croissance &gt;50%) : 6x</li>
        <li><strong>Valeur d&apos;Entreprise : 600 000 x 6 = 3 600 000 &#8364;</strong></li>
      </ul>

      <h3>Quand l&apos;utiliser</h3>

      <p>
        Pour les startups, les SaaS, les marketplaces et toute entreprise en forte croissance mais pas encore rentable. Le multiple depend fortement du taux de croissance et du churn.
      </p>

      <h2>Comment passer de la Valeur d&apos;Entreprise au Prix de Cession ?</h2>

      <p>
        La Valeur d&apos;Entreprise (VE) n&apos;est pas le prix que paiera l&apos;acheteur. Pour obtenir le <strong>prix de cession des parts</strong> (equity value), il faut appliquer le &quot;bridge&quot; :
      </p>

      <p><strong>Prix de cession = VE - Dettes financieres nettes + Tresorerie excedentaire - BFR normatif</strong></p>

      <p>Puis appliquer les decotes :</p>
      <ul>
        <li><strong>Decote d&apos;illiquidite</strong> : -15 a -25% (PME non cotee)</li>
        <li><strong>Decote de dependance dirigeant</strong> : -5 a -20%</li>
        <li><strong>Decote de concentration clients</strong> : -5 a -15%</li>
      </ul>

      <h2>Quelle methode choisir ?</h2>

      <table>
        <thead>
          <tr>
            <th>Type d&apos;entreprise</th>
            <th>Methode principale</th>
            <th>Methode secondaire</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>PME rentable (commerce, services)</td><td>Multiple d&apos;EBITDA</td><td>Comparables</td></tr>
          <tr><td>Startup / SaaS</td><td>Multiple de CA/ARR</td><td>DCF</td></tr>
          <tr><td>Industrie / Immobilier</td><td>Multiple d&apos;EBITDA</td><td>ANR</td></tr>
          <tr><td>Profession liberale</td><td>Comparables (% CA)</td><td>Multiple d&apos;EBITDA</td></tr>
          <tr><td>Holding patrimoniale</td><td>ANR</td><td>Multiple d&apos;EBITDA</td></tr>
          <tr><td>Entreprise pre-revenue</td><td>DCF</td><td>Comparables</td></tr>
        </tbody>
      </table>

      <blockquote>
        <p>
          <strong>Conseil :</strong> croisez toujours au moins deux methodes. Si les resultats divergent fortement, c&apos;est un signal qu&apos;il faut reexaminer les hypotheses.
        </p>
      </blockquote>

      <h2>Guides par secteur</h2>

      <p>Retrouvez des guides detailles par type d&apos;entreprise :</p>

      <ul>
        <li><Link href="/guide/valorisation-restaurant">Valorisation d&apos;un restaurant</Link></li>
        <li><Link href="/guide/valorisation-saas">Valorisation SaaS</Link></li>
        <li><Link href="/guide/valorisation-cabinet-comptable">Valorisation d&apos;un cabinet comptable</Link></li>
        <li><Link href="/guide/valorisation-commerce">Valorisation d&apos;un commerce</Link></li>
        <li><Link href="/guide/valorisation-pme-industrielle">Valorisation d&apos;une PME industrielle</Link></li>
        <li><Link href="/guide/valorisation-startup">Valorisation de startup</Link></li>
      </ul>

      <p>
        Pour un apercu general, consultez notre <Link href="/guide/valorisation-entreprise">guide complet de la valorisation d&apos;entreprise</Link>. Pour les <Link href="/tarifs">tarifs</Link>, consultez notre page dediee.
      </p>

      <div className="mt-12 p-6 bg-[var(--accent-light)] border border-[var(--accent)]/20 rounded-[var(--radius-xl)] text-center">
        <p className="text-[var(--text-primary)] font-semibold mb-2">Appliquez les 5 methodes a votre entreprise</p>
        <p className="text-[var(--text-secondary)] text-sm mb-4">EvalUp applique automatiquement les methodes adaptees a votre profil</p>
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
