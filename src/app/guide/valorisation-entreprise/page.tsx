import Link from 'next/link'

export default function ValorisationEntreprisePage() {
  return (
    <>
      <p className="text-[var(--text-muted)] text-sm mb-2">Guide mis a jour en fevrier 2025</p>
      <h1>Comment valoriser une entreprise en France ?</h1>

      <p>
        <strong>La valorisation d&apos;une entreprise consiste a estimer sa valeur economique</strong> en vue d&apos;une cession, d&apos;une transmission, d&apos;une levee de fonds ou d&apos;un bilan patrimonial. En France, cette estimation repose sur des methodes financieres reconnues, adaptees au profil de l&apos;entreprise (PME, startup, commerce, industrie, SaaS).
      </p>

      <blockquote>
        <p>
          <strong>En resume :</strong> la valeur d&apos;une entreprise se situe generalement entre 3x et 7x son EBITDA retraite pour une PME rentable. Les startups et entreprises SaaS sont valorisees sur un multiple de chiffre d&apos;affaires (1x a 10x selon la croissance).
        </p>
      </blockquote>

      <h2>Pourquoi valoriser son entreprise ?</h2>

      <p>Il existe de nombreuses raisons de faire valoriser une entreprise :</p>

      <ul>
        <li><strong>Cession ou vente</strong> : connaitre le prix de marche avant de negocier avec un repreneur</li>
        <li><strong>Transmission familiale</strong> : evaluer le patrimoine professionnel pour organiser la succession</li>
        <li><strong>Divorce ou separation</strong> : determiner la valeur des parts sociales dans le cadre d&apos;un partage</li>
        <li><strong>Conflit entre associes</strong> : fixer un prix de rachat equitable</li>
        <li><strong>Levee de fonds</strong> : negocier la dilution avec les investisseurs</li>
        <li><strong>Rachat d&apos;entreprise</strong> : evaluer la cible avant de formuler une offre</li>
        <li><strong>Bilan patrimonial</strong> : integrer la valeur de l&apos;entreprise dans son patrimoine global</li>
      </ul>

      <h2>Les 5 methodes de valorisation</h2>

      <p>
        Il n&apos;existe pas une seule methode de valorisation, mais plusieurs approches complementaires. Le choix depend du type d&apos;entreprise, de sa rentabilite et de son secteur d&apos;activite.
      </p>

      <h3>1. Multiple d&apos;EBITDA</h3>

      <p>
        C&apos;est la methode la plus utilisee pour valoriser une PME rentable. L&apos;EBITDA (Excedent Brut d&apos;Exploitation retraite) represente la capacite beneficiaire reelle de l&apos;entreprise. On lui applique un <strong>multiple sectoriel</strong> (generalement entre 3x et 8x) pour obtenir la Valeur d&apos;Entreprise (VE).
      </p>

      <p><strong>Formule :</strong> Valeur d&apos;Entreprise = EBITDA retraite x Multiple sectoriel</p>

      <p>
        Les multiples sectoriels sont publies par le professeur Aswath Damodaran (NYU Stern) et mis a jour chaque annee. Ils varient selon le secteur : un commerce de detail aura un multiple de 4-5x, tandis qu&apos;une entreprise de logiciel aura un multiple de 8-12x.
      </p>

      <h3>2. Discounted Cash Flow (DCF)</h3>

      <p>
        La methode DCF estime la valeur de l&apos;entreprise a partir de ses <strong>flux de tresorerie futurs actualises</strong>. Elle convient particulierement aux entreprises en croissance dont la valeur depend davantage du futur que du passe.
      </p>

      <p>
        Le taux d&apos;actualisation (WACC — Weighted Average Cost of Capital) tient compte du risque de l&apos;entreprise. Plus le risque est eleve, plus le taux est eleve, et plus la valorisation baisse.
      </p>

      <h3>3. Actif Net Reevalue (ANR)</h3>

      <p>
        L&apos;ANR valorise l&apos;entreprise par ses actifs : immobilier, equipements, stocks, tresorerie, moins les dettes. Cette methode est pertinente pour les entreprises a forte composante patrimoniale (immobilier, industrie lourde).
      </p>

      <h3>4. Methode des comparables</h3>

      <p>
        On compare l&apos;entreprise a des transactions recentes dans le meme secteur. Si des entreprises similaires se sont vendues a 5x l&apos;EBITDA, c&apos;est un indicateur du prix de marche.
      </p>

      <h3>5. Multiple de chiffre d&apos;affaires</h3>

      <p>
        Utilisee pour les entreprises pas encore rentables (startups, SaaS en phase de croissance). Le multiple de CA varie de 0,5x a 10x selon le secteur et la croissance.
      </p>

      <p>
        Pour une explication detaillee de chaque methode avec des exemples chiffres, consultez notre <Link href="/guide/methodes-valorisation">guide des methodes de valorisation</Link>.
      </p>

      <h2>Les retraitements de l&apos;EBITDA</h2>

      <p>
        Avant d&apos;appliquer un multiple, il faut <strong>retraiter l&apos;EBITDA</strong> pour obtenir la capacite beneficiaire normalisee. Les principaux retraitements sont :
      </p>

      <table>
        <thead>
          <tr>
            <th>Retraitement</th>
            <th>Description</th>
            <th>Impact</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Salaire du dirigeant</strong></td>
            <td>Normaliser a un salaire de marche (un gerant sous-paye gonfle artificiellement l&apos;EBITDA)</td>
            <td>-20 a -80 k&#8364;/an</td>
          </tr>
          <tr>
            <td><strong>Loyer</strong></td>
            <td>Si le local appartient au dirigeant, ajouter un loyer de marche</td>
            <td>-10 a -40 k&#8364;/an</td>
          </tr>
          <tr>
            <td><strong>Credit-bail</strong></td>
            <td>Reintegrer les loyers de credit-bail dans l&apos;EBITDA</td>
            <td>+5 a +30 k&#8364;/an</td>
          </tr>
          <tr>
            <td><strong>Charges exceptionnelles</strong></td>
            <td>Exclure les elements non recurrents (litiges, sinistres, restructuration)</td>
            <td>Variable</td>
          </tr>
          <tr>
            <td><strong>Salaires famille</strong></td>
            <td>Normaliser les salaires excessifs ou insuffisants verses a la famille</td>
            <td>Variable</td>
          </tr>
        </tbody>
      </table>

      <h2>Les decotes et primes</h2>

      <p>
        Une fois la Valeur d&apos;Entreprise calculee, on applique des decotes et primes pour obtenir le <strong>prix de cession</strong> :
      </p>

      <ul>
        <li><strong>Decote d&apos;illiquidite (15-25%)</strong> : une PME non cotee est moins liquide qu&apos;une action en bourse</li>
        <li><strong>Decote de dependance au dirigeant (5-20%)</strong> : si l&apos;entreprise depend fortement de son fondateur</li>
        <li><strong>Decote de concentration clients (5-15%)</strong> : si un seul client represente plus de 30% du CA</li>
        <li><strong>Prime de recurrence (+5-10%)</strong> : pour les revenus recurrents (abonnements, contrats long terme)</li>
        <li><strong>Passage VE &#8594; Prix</strong> : soustraire les dettes financieres, ajouter la tresorerie excedentaire</li>
      </ul>

      <h2>Erreurs courantes a eviter</h2>

      <ol>
        <li><strong>Ne pas retraiter l&apos;EBITDA</strong> : un EBITDA comptable ne reflete pas la capacite beneficiaire reelle</li>
        <li><strong>Utiliser un multiple generique</strong> : chaque secteur a ses propres multiples (un commerce &#8800; un SaaS)</li>
        <li><strong>Ignorer les dettes</strong> : la Valeur d&apos;Entreprise n&apos;est pas le prix de cession (il faut soustraire les dettes)</li>
        <li><strong>Se fier a une seule methode</strong> : croiser 2-3 methodes donne une fourchette plus fiable</li>
        <li><strong>Surestimer la croissance future</strong> : les acheteurs valorisent le passe, pas les promesses</li>
        <li><strong>Oublier les decotes</strong> : une PME non cotee vaut structurellement moins qu&apos;une entreprise cotee a EBITDA equivalent</li>
      </ol>

      <h2>Combien coute une valorisation d&apos;entreprise ?</h2>

      <p>
        Les couts varient selon le prestataire :
      </p>

      <table>
        <thead>
          <tr>
            <th>Prestataire</th>
            <th>Prix</th>
            <th>Delai</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Expert-comptable</td>
            <td>2 000 - 5 000 &#8364;</td>
            <td>2 a 4 semaines</td>
          </tr>
          <tr>
            <td>Cabinet M&amp;A</td>
            <td>5 000 - 15 000 &#8364;</td>
            <td>4 a 8 semaines</td>
          </tr>
          <tr>
            <td>EvalUp (IA)</td>
            <td>79 &#8364;</td>
            <td>10 minutes</td>
          </tr>
        </tbody>
      </table>

      <p>
        <Link href="/tarifs">EvalUp</Link> utilise l&apos;intelligence artificielle pour automatiser le processus : recuperation des donnees Pappers, detection de l&apos;archetype sectoriel, application des 5 methodes, generation d&apos;un rapport PDF de 28 pages.
      </p>

      <h2>A retenir</h2>

      <blockquote>
        <p>
          La valorisation d&apos;une entreprise n&apos;est pas un chiffre unique mais une <strong>fourchette</strong>. Elle depend de la methode utilisee, des retraitements appliques et du contexte de la transaction. Pour une PME rentable en France, le multiple d&apos;EBITDA retraite est la methode de reference, avec des multiples generalement compris entre 3x et 7x selon le secteur.
        </p>
      </blockquote>

      <h2>Guides par secteur</h2>

      <p>
        Chaque secteur a ses propres multiples et specificites. Consultez nos guides detailles :
      </p>

      <ul>
        <li><Link href="/guide/valorisation-restaurant">Valorisation d&apos;un restaurant</Link> — baremes % CA, droit au bail, licence IV</li>
        <li><Link href="/guide/valorisation-saas">Valorisation SaaS</Link> — multiples ARR, Rule of 40, metriques cles</li>
        <li><Link href="/guide/valorisation-cabinet-comptable">Valorisation d&apos;un cabinet comptable</Link> — % du CA recurrent, clauses de cession</li>
        <li><Link href="/guide/valorisation-commerce">Valorisation d&apos;un commerce</Link> — fonds de commerce, droit au bail, stock</li>
        <li><Link href="/guide/valorisation-pme-industrielle">Valorisation d&apos;une PME industrielle</Link> — EBITDA, ANR, carnet de commandes</li>
        <li><Link href="/guide/valorisation-startup">Valorisation de startup</Link> — methodes pre-revenue, Berkus, Scorecard</li>
      </ul>

      <p>
        Pour comprendre le detail de chaque methode avec des exemples chiffres, consultez notre <Link href="/guide/methodes-valorisation">guide des methodes de valorisation</Link>. Si vous avez des questions, visitez notre <Link href="/aide">FAQ</Link>.
      </p>

      <div className="mt-12 p-6 bg-[var(--accent-light)] border border-[var(--accent)]/20 rounded-[var(--radius-xl)] text-center">
        <p className="text-[var(--text-primary)] font-semibold mb-2">Valorisez votre entreprise en 10 minutes</p>
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
