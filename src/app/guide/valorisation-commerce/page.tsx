import Link from 'next/link'

export default function ValorisationCommercePage() {
  return (
    <>
      <p className="text-[var(--text-muted)] text-sm mb-2">Guide mis a jour en fevrier 2025</p>
      <h1>Valorisation d&apos;un commerce : fonds de commerce, droit au bail et multiples</h1>

      <p>
        <strong>Un commerce en France se valorise entre 3x et 5x l&apos;EBITDA retraite</strong>, ou entre 50% et 100% du chiffre d&apos;affaires TTC selon le secteur. La valorisation repose sur la valeur du fonds de commerce, qui inclut la clientele, le droit au bail, l&apos;enseigne et le materiel.
      </p>

      <blockquote>
        <p>
          <strong>En resume :</strong> pour un commerce de detail avec un CA de 400 000 &#8364; et un EBITDA retraite de 60 000 &#8364;, la fourchette de valorisation du fonds se situe entre 180 000 &#8364; et 300 000 &#8364;.
        </p>
      </blockquote>

      <h2>Les composantes de la valeur d&apos;un commerce</h2>

      <h3>1. Le fonds de commerce</h3>

      <p>
        Le fonds de commerce regroupe les <strong>elements incorporels</strong> (clientele, droit au bail, enseigne, nom commercial) et les <strong>elements corporels</strong> (materiel, agencements, stock). C&apos;est la valeur principale dans la cession d&apos;un commerce.
      </p>

      <h3>2. Le droit au bail</h3>

      <p>
        Le droit au bail represente la valeur economique du bail commercial. Plus le loyer est inferieur au prix du marche, plus le droit au bail a de la valeur. En centre-ville de Paris, le droit au bail peut representer <strong>50% a 70% de la valeur totale du fonds</strong>.
      </p>

      <p>Methode de calcul du droit au bail :</p>
      <p><strong>Droit au bail = (Loyer de marche - Loyer actuel) x Duree restante du bail x Coefficient</strong></p>

      <h3>3. Le stock</h3>

      <p>
        Le stock est generalement valorise <strong>au prix de revient</strong> (pas au prix de vente) et negocie separement du fonds de commerce. Les stocks obsoletes ou invendables sont exclus.
      </p>

      <h2>Les methodes de valorisation par type de commerce</h2>

      <table>
        <thead>
          <tr>
            <th>Type de commerce</th>
            <th>% du CA TTC</th>
            <th>Multiple EBITDA</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Boulangerie-patisserie</td><td>60% - 90%</td><td>4x - 5,5x</td></tr>
          <tr><td>Boucherie-charcuterie</td><td>40% - 70%</td><td>3x - 4,5x</td></tr>
          <tr><td>Pharmacie</td><td>70% - 90%</td><td>6x - 8x</td></tr>
          <tr><td>Fleuriste</td><td>40% - 60%</td><td>3x - 4x</td></tr>
          <tr><td>Salon de coiffure</td><td>50% - 80%</td><td>3,5x - 5x</td></tr>
          <tr><td>Pret-a-porter</td><td>30% - 60%</td><td>3x - 4x</td></tr>
          <tr><td>Opticien</td><td>50% - 80%</td><td>4x - 6x</td></tr>
          <tr><td>Tabac-presse</td><td>80% - 120%</td><td>5x - 7x</td></tr>
          <tr><td>Superette / epicerie</td><td>20% - 40%</td><td>3x - 4x</td></tr>
        </tbody>
      </table>

      <p className="text-sm text-[var(--text-muted)]">
        Source : baremes Francis Lefebvre, observatoire CCI des cessions de fonds de commerce.
      </p>

      <h2>Les retraitements de l&apos;EBITDA pour un commerce</h2>

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
            <td><strong>Salaire du gerant</strong></td>
            <td>Le gerant-proprietaire se sous-paye souvent de 10-20k&#8364;/an</td>
            <td>-10 a -25 k&#8364;/an</td>
          </tr>
          <tr>
            <td><strong>Heures familiales</strong></td>
            <td>Conjoint(e) travaillant sans remuneration adequate</td>
            <td>-15 a -30 k&#8364;/an</td>
          </tr>
          <tr>
            <td><strong>Loyer SCI</strong></td>
            <td>Si les murs appartiennent au dirigeant, normaliser le loyer</td>
            <td>-5 a -20 k&#8364;/an</td>
          </tr>
          <tr>
            <td><strong>Depenses personnelles</strong></td>
            <td>Vehicule, telephone, deplacements personnels passes en charges</td>
            <td>-3 a -10 k&#8364;/an</td>
          </tr>
          <tr>
            <td><strong>Travaux exceptionnels</strong></td>
            <td>Renovation, mise aux normes, refonte devanture</td>
            <td>A exclure</td>
          </tr>
        </tbody>
      </table>

      <h2>Les facteurs de valorisation d&apos;un commerce</h2>

      <h3>Facteurs positifs</h3>

      <ul>
        <li><strong>Emplacement n&#176;1</strong> : rue commercante, flux pietonne eleve, visibilite</li>
        <li><strong>Bail favorable</strong> : loyer &lt; marche, duree restante &gt; 6 ans</li>
        <li><strong>Clientele fidele et reguliere</strong> : taux de retour eleve, panier moyen stable</li>
        <li><strong>Rentabilite prouvee</strong> : EBITDA/CA &gt; 12% pour un commerce de detail</li>
        <li><strong>Diversification des revenus</strong> : vente en ligne, click &amp; collect, livraison</li>
        <li><strong>Pas de dependance au dirigeant</strong> : l&apos;equipe peut fonctionner sans le proprietaire</li>
        <li><strong>Conformite</strong> : normes hygiene, accessibilite, securite a jour</li>
      </ul>

      <h3>Facteurs negatifs</h3>

      <ul>
        <li><strong>Bail precaire</strong> : moins de 3 ans restant, forte augmentation prevue</li>
        <li><strong>Travaux a prevoir</strong> : mise aux normes, refection facade, materiel vieillissant</li>
        <li><strong>Zone en declin</strong> : baisse de frequentation, fermetures de commerces voisins</li>
        <li><strong>Concurrence e-commerce</strong> : secteurs fortement menaces (pret-a-porter, librairie)</li>
        <li><strong>Saisonnalite forte</strong> : CA concentre sur quelques mois</li>
      </ul>

      <h2>Exemple complet de valorisation</h2>

      <p>Boulangerie-patisserie en centre-ville, 2 salaries :</p>

      <ul>
        <li>CA TTC : 380 000 &#8364;</li>
        <li>EBITDA comptable : 72 000 &#8364;</li>
        <li>Retraitement salaire gerant : -12 000 &#8364;</li>
        <li>Retraitement conjoint non remunere (20h/sem) : -15 000 &#8364;</li>
        <li><strong>EBITDA retraite : 45 000 &#8364;</strong></li>
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
          <tr><td>% du CA (70%)</td><td>380k x 0,7</td><td>266 000 &#8364;</td></tr>
          <tr><td>% du CA (85%)</td><td>380k x 0,85</td><td>323 000 &#8364;</td></tr>
          <tr><td>Multiple EBITDA (5x)</td><td>45k x 5</td><td>225 000 &#8364;</td></tr>
          <tr><td>Multiple EBITDA (5,5x)</td><td>45k x 5,5</td><td>247 500 &#8364;</td></tr>
        </tbody>
      </table>

      <p>
        <strong>Fourchette de valorisation : 225 000 - 320 000 &#8364;</strong> (fonds de commerce hors stock).
      </p>

      <p>
        Le stock (matières premières) sera valorise separement, typiquement 5 000 - 15 000 &#8364; pour une boulangerie.
      </p>

      <h2>Le passage du prix a la transaction</h2>

      <p>
        Une fois la fourchette de valorisation etablie, le prix final depend de la negociation. Les elements cles :
      </p>

      <ol>
        <li><strong>Accompagnement du cedant</strong> : 1 a 3 mois de transition pour presenter les clients et fournisseurs</li>
        <li><strong>Clause de non-concurrence</strong> : le vendeur s&apos;engage a ne pas ouvrir un commerce similaire a proximite</li>
        <li><strong>Garantie d&apos;actif et de passif</strong> : protection contre les dettes cachees</li>
        <li><strong>Condition suspensive</strong> : obtention du financement bancaire (souvent 70% du prix)</li>
      </ol>

      <h2>Liens utiles</h2>

      <ul>
        <li><Link href="/guide/valorisation-entreprise">Guide general de la valorisation d&apos;entreprise</Link></li>
        <li><Link href="/guide/valorisation-restaurant">Valorisation d&apos;un restaurant</Link></li>
        <li><Link href="/guide/methodes-valorisation">Les 5 methodes de valorisation expliquees</Link></li>
      </ul>

      <div className="mt-12 p-6 bg-[var(--accent-light)] border border-[var(--accent)]/20 rounded-[var(--radius-xl)] text-center">
        <p className="text-[var(--text-primary)] font-semibold mb-2">Valorisez votre commerce en 10 minutes</p>
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
