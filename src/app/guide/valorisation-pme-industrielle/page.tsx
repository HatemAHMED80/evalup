import Link from 'next/link'

export default function ValorisationPMEIndustriellePage() {
  return (
    <>
      <p className="text-[var(--text-muted)] text-sm mb-2">Guide mis a jour en fevrier 2025</p>
      <h1>Valorisation d&apos;une PME industrielle : EBITDA, actifs et multiples sectoriels</h1>

      <p>
        <strong>Une PME industrielle en France se valorise entre 4x et 6x l&apos;EBITDA retraite</strong>. L&apos;actif net reevalue (machines, immobilier, stocks) sert de valeur plancher. La valorisation d&apos;une entreprise industrielle tient compte du carnet de commandes, de la dependance client et de l&apos;etat de l&apos;outil de production.
      </p>

      <blockquote>
        <p>
          <strong>Repere :</strong> une PME industrielle avec un CA de 3M&#8364; et un EBITDA retraite de 400 000 &#8364; se valorise entre 1,6M&#8364; et 2,4M&#8364; (Valeur d&apos;Entreprise), avant ajustement pour la dette nette et le BFR.
        </p>
      </blockquote>

      <h2>Pourquoi l&apos;industrie a ses propres multiples ?</h2>

      <p>
        Les PME industrielles ont des caracteristiques qui les distinguent des services ou du commerce :
      </p>

      <ul>
        <li><strong>Capital-intensives</strong> : machines, ateliers, stocks de matieres premieres = investissements lourds</li>
        <li><strong>Cycliques</strong> : sensibles aux cycles economiques (automobile, construction, aeronautique)</li>
        <li><strong>BFR eleve</strong> : stocks + creances clients = besoin en fonds de roulement important</li>
        <li><strong>Actifs tangibles</strong> : l&apos;immobilier et les equipements ont une valeur patrimoniale reelle</li>
      </ul>

      <p>
        Ces caracteristiques expliquent des multiples plus bas que les services (4-6x vs 5-8x) mais une valeur plancher patrimoniale souvent significative.
      </p>

      <h2>Les methodes de valorisation</h2>

      <h3>1. Multiple d&apos;EBITDA (methode principale)</h3>

      <p>
        Le multiple d&apos;EBITDA est la methode privilegiee. Les multiples varient selon le sous-secteur industriel :
      </p>

      <table>
        <thead>
          <tr>
            <th>Sous-secteur industriel</th>
            <th>Multiple EV/EBITDA</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Metallurgie / usinage</td><td>4,0x - 5,5x</td></tr>
          <tr><td>Agroalimentaire</td><td>4,5x - 6,5x</td></tr>
          <tr><td>Chimie / pharmacie</td><td>6,0x - 8,0x</td></tr>
          <tr><td>Plasturgie / caoutchouc</td><td>4,0x - 5,5x</td></tr>
          <tr><td>Mecanique de precision</td><td>4,5x - 6,0x</td></tr>
          <tr><td>Electronique / composants</td><td>5,0x - 7,0x</td></tr>
          <tr><td>BTP / travaux publics</td><td>3,5x - 5,0x</td></tr>
          <tr><td>Emballage / conditionnement</td><td>5,0x - 6,5x</td></tr>
          <tr><td>Bois / ameublement</td><td>3,5x - 5,0x</td></tr>
        </tbody>
      </table>

      <p className="text-sm text-[var(--text-muted)]">
        Source : Aswath Damodaran, multiples EV/EBITDA Europe. Ajustes pour les PME francaises (decote taille et illiquidite).
      </p>

      <h3>2. Actif Net Reevalue (ANR) — la valeur plancher</h3>

      <p>
        L&apos;ANR est particulierement pertinent pour les PME industrielles car elles possedent des <strong>actifs tangibles significatifs</strong> : batiments, machines-outils, stocks. L&apos;ANR sert de valeur plancher : si le multiple d&apos;EBITDA donne une valorisation inferieure a l&apos;ANR, c&apos;est l&apos;ANR qui prevaut.
      </p>

      <p>Points d&apos;attention pour la reevaluation des actifs :</p>

      <ul>
        <li><strong>Immobilier</strong> : faire evaluer par un expert immobilier (valeur comptable souvent tres inferieure au marche)</li>
        <li><strong>Machines</strong> : valeur de remplacement ou valeur de marche (un tour CNC de 10 ans peut valoir 30% de son prix neuf)</li>
        <li><strong>Stocks</strong> : attention aux stocks morts ou obsoletes (matiere premiere perimee, produits finis invendables)</li>
        <li><strong>Brevets et savoir-faire</strong> : difficiles a valoriser mais peuvent justifier une prime</li>
      </ul>

      <h3>3. DCF (pour les PME en croissance)</h3>

      <p>
        Le DCF est utilise en complement lorsque l&apos;entreprise a un <strong>carnet de commandes solide</strong> qui justifie des projections de croissance. Le taux d&apos;actualisation (WACC) est generalement de 10-14% pour une PME industrielle.
      </p>

      <h2>Les retraitements specifiques a l&apos;industrie</h2>

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
            <td>Normaliser a 80-150k&#8364;/an selon la taille</td>
            <td>-20 a -60 k&#8364;/an</td>
          </tr>
          <tr>
            <td><strong>Credit-bail</strong></td>
            <td>Reintegrer les loyers de credit-bail dans l&apos;EBITDA (et la dette dans le bridge)</td>
            <td>+20 a +100 k&#8364;/an</td>
          </tr>
          <tr>
            <td><strong>Maintenance exceptionnelle</strong></td>
            <td>Revision majeure de machine, remplacement exceptionnel</td>
            <td>A exclure</td>
          </tr>
          <tr>
            <td><strong>Subventions</strong></td>
            <td>CIR, aides regionales : si non recurrentes, exclure</td>
            <td>Variable</td>
          </tr>
          <tr>
            <td><strong>Provisions excessives</strong></td>
            <td>Provisions pour risques sans fondement reel</td>
            <td>A reintegrer</td>
          </tr>
        </tbody>
      </table>

      <h2>Les facteurs de valorisation specifiques</h2>

      <h3>Facteurs positifs (prime)</h3>

      <ul>
        <li><strong>Carnet de commandes</strong> : visibilite a 6-12 mois = securite pour l&apos;acheteur</li>
        <li><strong>Diversification clients</strong> : aucun client &gt; 15% du CA</li>
        <li><strong>Certifications</strong> : ISO 9001, ISO 14001, EN 9100 (aeronautique) = barriere a l&apos;entree</li>
        <li><strong>Outil de production moderne</strong> : machines recentes, automatisation, industrie 4.0</li>
        <li><strong>Equipe qualifiee</strong> : techniciens, ingenieurs, savoir-faire transmis</li>
        <li><strong>Brevets et propriete intellectuelle</strong> : avantage concurrentiel protege</li>
        <li><strong>Immobilier en propriete</strong> : batiments qui ont une valeur patrimoniale</li>
      </ul>

      <h3>Facteurs negatifs (decote)</h3>

      <ul>
        <li><strong>Dependance a 1-2 clients</strong> : un donneur d&apos;ordres &gt; 30% du CA = risque majeur (decote 15-25%)</li>
        <li><strong>Outil de production vieillissant</strong> : investissements lourds a prevoir (&gt; 1 an de cash flow)</li>
        <li><strong>Normes environnementales</strong> : mise aux normes ICPE, depollution = passif environnemental</li>
        <li><strong>Mono-produit</strong> : dependance a une seule technologie ou un seul marche</li>
        <li><strong>Pyramide des ages</strong> : departs en retraite massifs dans les 5 prochaines annees</li>
        <li><strong>Tensions sociales</strong> : historique de greves, contentieux prud&apos;homaux</li>
      </ul>

      <h2>Exemple complet de valorisation</h2>

      <p>PME de mecanique de precision, sous-traitant aeronautique, 25 salaries :</p>

      <ul>
        <li>CA : 3 200 000 &#8364;</li>
        <li>EBITDA comptable : 520 000 &#8364;</li>
        <li>Retraitement salaire dirigeant : -40 000 &#8364;</li>
        <li>Retraitement credit-bail machines : +60 000 &#8364;</li>
        <li>Retraitement maintenance exceptionnelle : +35 000 &#8364;</li>
        <li><strong>EBITDA retraite : 475 000 &#8364;</strong></li>
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
          <tr><td>Multiple EBITDA (4,5x)</td><td>475k x 4,5</td><td>2 137 500 &#8364;</td></tr>
          <tr><td>Multiple EBITDA (5,5x)</td><td>475k x 5,5</td><td>2 612 500 &#8364;</td></tr>
          <tr><td>ANR (valeur plancher)</td><td>Actifs reevalues - dettes</td><td>1 800 000 &#8364;</td></tr>
        </tbody>
      </table>

      <p>
        <strong>Fourchette VE : 2,1M - 2,6M&#8364;</strong>. L&apos;ANR confirme que le plancher patrimonial (1,8M&#8364;) est inferieur au multiple d&apos;EBITDA.
      </p>

      <p>
        Bridge vers le prix de cession : VE 2,4M - dette nette 300k - BFR excedentaire 150k = <strong>prix de cession estime : 1,95M&#8364;</strong>.
      </p>

      <h2>Specificite : le BFR industriel</h2>

      <p>
        Le BFR (Besoin en Fonds de Roulement) est un element critique dans la valorisation industrielle. Un BFR eleve (stocks + creances - fournisseurs) reduit le prix de cession. L&apos;acheteur devra financer ce BFR des la reprise.
      </p>

      <p>
        Typiquement, le BFR d&apos;une PME industrielle represente <strong>15% a 25% du CA</strong>. Un BFR superieur a la norme sectorielle justifie un ajustement negatif dans le bridge de valorisation.
      </p>

      <h2>Liens utiles</h2>

      <ul>
        <li><Link href="/guide/valorisation-entreprise">Guide general de la valorisation d&apos;entreprise</Link></li>
        <li><Link href="/guide/methodes-valorisation">Les 5 methodes de valorisation expliquees</Link></li>
        <li><Link href="/guide/valorisation-commerce">Valorisation d&apos;un commerce</Link></li>
      </ul>

      <div className="mt-12 p-6 bg-[var(--accent-light)] border border-[var(--accent)]/20 rounded-[var(--radius-xl)] text-center">
        <p className="text-[var(--text-primary)] font-semibold mb-2">Valorisez votre PME industrielle en 10 minutes</p>
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
