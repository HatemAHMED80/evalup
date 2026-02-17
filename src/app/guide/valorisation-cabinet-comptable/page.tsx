import Link from 'next/link'

export default function ValorisationCabinetComptablePage() {
  return (
    <>
      <p className="text-[var(--text-muted)] text-sm mb-2">Guide mis a jour en fevrier 2025</p>
      <h1>Valorisation d&apos;un cabinet comptable : methodes, multiples et facteurs cles</h1>

      <p>
        <strong>Un cabinet d&apos;expertise comptable en France se valorise entre 80% et 120% de son chiffre d&apos;affaires recurrent</strong>. Cette fourchette peut descendre a 60% pour un cabinet fragile (dependance au dirigeant, clientele vieillissante) ou monter a 140% pour un cabinet premium (digitalise, clientele jeune, missions a forte valeur ajoutee).
      </p>

      <blockquote>
        <p>
          <strong>Repere :</strong> un cabinet comptable avec 600 000 &#8364; de CA recurrent se negocie typiquement entre 480 000 &#8364; et 720 000 &#8364;, soit 0,8x a 1,2x le CA.
        </p>
      </blockquote>

      <h2>La methode de reference : pourcentage du CA recurrent</h2>

      <p>
        Dans la profession comptable, la methode des <strong>comparables en % du CA</strong> est la reference. Les transactions sont suffisamment nombreuses pour constituer un marche avec des benchmarks fiables.
      </p>

      <table>
        <thead>
          <tr>
            <th>Type de cabinet</th>
            <th>% du CA recurrent</th>
            <th>Commentaire</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Cabinet generaliste rural</td><td>70% - 90%</td><td>Clientele TPE, faible croissance</td></tr>
          <tr><td>Cabinet generaliste urbain</td><td>80% - 110%</td><td>Marche plus dynamique</td></tr>
          <tr><td>Cabinet specialise (medical, SCI)</td><td>90% - 120%</td><td>Expertise = prime</td></tr>
          <tr><td>Cabinet digitalise (full cloud)</td><td>100% - 140%</td><td>Scalabilite + clientele jeune</td></tr>
          <tr><td>Cabinet avec commissariat aux comptes</td><td>80% - 100%</td><td>CAC en declin progressif</td></tr>
        </tbody>
      </table>

      <h2>Methode complementaire : multiple d&apos;EBITDA</h2>

      <p>
        Pour les cabinets de taille significative (&gt; 1M&#8364; CA), la methode du <strong>multiple d&apos;EBITDA</strong> permet d&apos;affiner la valorisation. Le multiple se situe entre <strong>5x et 8x l&apos;EBITDA retraite</strong>.
      </p>

      <p>
        L&apos;EBITDA retraite d&apos;un cabinet comptable necessite des retraitements specifiques :
      </p>

      <table>
        <thead>
          <tr>
            <th>Retraitement</th>
            <th>Description</th>
            <th>Impact typique</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Salaire de l&apos;expert-comptable</strong></td>
            <td>Normaliser a 80-120k&#8364;/an selon la taille du cabinet</td>
            <td>-20 a -60 k&#8364;/an</td>
          </tr>
          <tr>
            <td><strong>Salaires collaborateurs famille</strong></td>
            <td>Conjoint(e) a un poste sans productivite reelle</td>
            <td>-20 a -40 k&#8364;/an</td>
          </tr>
          <tr>
            <td><strong>Vehicule personnel</strong></td>
            <td>Vehicule premium passe en charges</td>
            <td>-5 a -15 k&#8364;/an</td>
          </tr>
          <tr>
            <td><strong>Loyer</strong></td>
            <td>Si les locaux appartiennent a l&apos;expert-comptable (SCI)</td>
            <td>-10 a -30 k&#8364;/an</td>
          </tr>
        </tbody>
      </table>

      <h2>Les facteurs qui font varier la valorisation</h2>

      <h3>Facteurs positifs (prime)</h3>

      <ul>
        <li><strong>Clientele diversifiee</strong> : aucun client &gt; 5% du CA = stabilite</li>
        <li><strong>Lettres de mission signees</strong> : formalisation des honoraires = securite</li>
        <li><strong>Equipe autonome</strong> : les collaborateurs gerent les dossiers sans l&apos;EC</li>
        <li><strong>Digitalisation</strong> : outils cloud (Pennylane, Dext, Tiime), automatisation des saisies</li>
        <li><strong>Missions a forte VA</strong> : conseil, social, juridique, DAF externalise (&gt; tenue comptable)</li>
        <li><strong>Clientele jeune</strong> : startups, SaaS, e-commerce (vs artisans proches de la retraite)</li>
        <li><strong>Croissance du CA</strong> : +5-10% par an = cabinet dynamique</li>
      </ul>

      <h3>Facteurs negatifs (decote)</h3>

      <ul>
        <li><strong>Dependance a l&apos;EC</strong> : si le dirigeant gere personnellement &gt; 40% des dossiers, decote de 15-30%</li>
        <li><strong>Clientele vieillissante</strong> : artisans, commercants proches de la retraite = erosion previsible</li>
        <li><strong>Retard technologique</strong> : saisie manuelle, pas de GED, logiciel obsolete</li>
        <li><strong>Honoraires sous-evalues</strong> : clients historiques jamais revalorises depuis 10 ans</li>
        <li><strong>Turnover des collaborateurs</strong> : difficulte de recrutement dans la profession</li>
        <li><strong>Concentration geographique</strong> : mono-ville, mono-secteur</li>
      </ul>

      <h2>Les clauses specifiques a la cession de cabinet</h2>

      <h3>Clause de presentation de clientele</h3>

      <p>
        La cession d&apos;un cabinet comptable prend souvent la forme d&apos;une <strong>presentation de clientele</strong> (et non d&apos;une cession de fonds de commerce). Le cedant presente les clients au repreneur, qui signe de nouvelles lettres de mission.
      </p>

      <h3>Clause de non-concurrence</h3>

      <p>
        Le cedant s&apos;engage a ne pas exercer dans un perimetre geographique et temporel defini (generalement 3 a 5 ans, 30 a 50 km).
      </p>

      <h3>Clause de garantie de CA</h3>

      <p>
        Un pourcentage du prix (10-30%) est souvent verse en differe sur 2-3 ans, conditionne au maintien du CA. Si des clients partent, le prix est ajuste a la baisse. C&apos;est le mecanisme de <strong>earn-out</strong>.
      </p>

      <h2>Exemple complet de valorisation</h2>

      <p>Cabinet comptable generaliste, 4 collaborateurs, agglomeration de Nantes :</p>

      <ul>
        <li>CA total : 750 000 &#8364; (dont 680 000 &#8364; recurrent, 70 000 &#8364; CAC)</li>
        <li>EBITDA comptable : 180 000 &#8364;</li>
        <li>Retraitement salaire EC : -30 000 &#8364; (se verse 70k, marche a 100k)</li>
        <li>Retraitement vehicule : -8 000 &#8364;</li>
        <li><strong>EBITDA retraite : 142 000 &#8364;</strong></li>
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
          <tr><td>% CA recurrent (0,9x)</td><td>680k x 0,9</td><td>612 000 &#8364;</td></tr>
          <tr><td>% CA recurrent (1,1x)</td><td>680k x 1,1</td><td>748 000 &#8364;</td></tr>
          <tr><td>Multiple EBITDA (5x)</td><td>142k x 5</td><td>710 000 &#8364;</td></tr>
        </tbody>
      </table>

      <p>
        <strong>Fourchette de valorisation : 610 000 - 750 000 &#8364;</strong>.
      </p>

      <p>
        Avec une clause de garantie de CA a 20% sur 2 ans : 80% a la signature (490k - 600k &#8364;), 20% conditionnel (120k - 150k &#8364;).
      </p>

      <h2>Liens utiles</h2>

      <ul>
        <li><Link href="/guide/valorisation-entreprise">Guide general de la valorisation d&apos;entreprise</Link></li>
        <li><Link href="/guide/methodes-valorisation">Les 5 methodes de valorisation expliquees</Link></li>
        <li><Link href="/guide/valorisation-commerce">Valorisation d&apos;un commerce</Link></li>
      </ul>

      <div className="mt-12 p-6 bg-[var(--accent-light)] border border-[var(--accent)]/20 rounded-[var(--radius-xl)] text-center">
        <p className="text-[var(--text-primary)] font-semibold mb-2">Valorisez votre cabinet comptable en 10 minutes</p>
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
