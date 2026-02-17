import Link from 'next/link'

export default function ValorisationRestaurantPage() {
  return (
    <>
      <p className="text-[var(--text-muted)] text-sm mb-2">Guide mis a jour en fevrier 2025</p>
      <h1>Comment valoriser un restaurant en France ?</h1>

      <p>
        <strong>Un restaurant en France se valorise generalement entre 40% et 100% de son chiffre d&apos;affaires annuel TTC</strong>, soit entre 3x et 5x l&apos;EBITDA retraite. La valorisation depend fortement de l&apos;emplacement, du type de cuisine, de la reputation et du bail commercial.
      </p>

      <blockquote>
        <p>
          <strong>Ordre de grandeur :</strong> un restaurant avec un CA de 500 000 &#8364; et un EBITDA retraite de 80 000 &#8364; se valorise entre 250 000 &#8364; et 400 000 &#8364; (fonds de commerce), hors murs.
        </p>
      </blockquote>

      <h2>Les 3 methodes pour valoriser un restaurant</h2>

      <h3>1. Pourcentage du chiffre d&apos;affaires (methode barème)</h3>

      <p>
        C&apos;est la methode la plus utilisee pour les fonds de commerce en restauration. Les baremes professionnels (Francis Lefebvre, CCI) fixent des fourchettes par type d&apos;etablissement :
      </p>

      <table>
        <thead>
          <tr>
            <th>Type de restaurant</th>
            <th>% du CA TTC</th>
            <th>Exemple (CA 500k&#8364;)</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Restaurant traditionnel</td><td>50% - 80%</td><td>250k - 400k &#8364;</td></tr>
          <tr><td>Restauration rapide</td><td>40% - 70%</td><td>200k - 350k &#8364;</td></tr>
          <tr><td>Brasserie</td><td>60% - 90%</td><td>300k - 450k &#8364;</td></tr>
          <tr><td>Restaurant gastronomique</td><td>70% - 100%</td><td>350k - 500k &#8364;</td></tr>
          <tr><td>Pizzeria</td><td>50% - 80%</td><td>250k - 400k &#8364;</td></tr>
          <tr><td>Bar-restaurant</td><td>60% - 100%</td><td>300k - 500k &#8364;</td></tr>
        </tbody>
      </table>

      <p className="text-sm text-[var(--text-muted)]">
        Source : baremes Francis Lefebvre et observatoire des transactions CCI.
      </p>

      <h3>2. Multiple d&apos;EBITDA retraite</h3>

      <p>
        La methode des multiples d&apos;EBITDA est plus rigoureuse. Pour la restauration en France, le <strong>multiple EV/EBITDA se situe entre 3x et 5x</strong> selon la taille et le profil :
      </p>

      <ul>
        <li><strong>Petit restaurant (&lt; 300k&#8364; CA)</strong> : 3x - 3,5x</li>
        <li><strong>Restaurant moyen (300k - 800k&#8364; CA)</strong> : 3,5x - 4,5x</li>
        <li><strong>Restaurant etabli (&gt; 800k&#8364; CA)</strong> : 4x - 5x</li>
        <li><strong>Chaine / franchise</strong> : 5x - 6x</li>
      </ul>

      <p>
        <strong>Attention :</strong> l&apos;EBITDA doit etre retraite. Dans la restauration, les retraitements courants sont la remuneration du gerant (souvent sous-paye), les avantages en nature (repas, vehicule) et les charges familiales.
      </p>

      <h3>3. Methode du droit au bail</h3>

      <p>
        Le droit au bail represente la valeur du bail commercial. Il est particulierement important dans les emplacements premium (Paris, Lyon, centres-villes). Le droit au bail peut representer <strong>30% a 60% de la valeur totale du fonds</strong> en zone tres frequentee.
      </p>

      <h2>Les retraitements specifiques a la restauration</h2>

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
            <td><strong>Salaire du gerant</strong></td>
            <td>Un gerant-proprietaire se verse souvent 1 500 - 2 000 &#8364;/mois, le marche est a 3 000 - 4 000 &#8364;</td>
            <td>-15 a -25 k&#8364;/an</td>
          </tr>
          <tr>
            <td><strong>Repas et avantages</strong></td>
            <td>Repas du dirigeant et de la famille pris sur le stock</td>
            <td>-3 a -8 k&#8364;/an</td>
          </tr>
          <tr>
            <td><strong>Loyer</strong></td>
            <td>Si le local appartient au dirigeant, ajouter un loyer de marche</td>
            <td>-12 a -40 k&#8364;/an</td>
          </tr>
          <tr>
            <td><strong>Travaux non recurrents</strong></td>
            <td>Renovation cuisine, mise aux normes : a exclure de l&apos;EBITDA</td>
            <td>Variable</td>
          </tr>
          <tr>
            <td><strong>Cash non declare</strong></td>
            <td>Un acheteur ne peut pas valoriser ce qu&apos;il ne peut pas prouver</td>
            <td>0 (non retenu)</td>
          </tr>
        </tbody>
      </table>

      <h2>Les facteurs qui font varier la valorisation</h2>

      <h3>Facteurs positifs (prime de valeur)</h3>

      <ul>
        <li><strong>Emplacement premium</strong> : rue passante, zone touristique, gare — peut doubler la valeur du fonds</li>
        <li><strong>Bail favorable</strong> : loyer inferieur au marche, bail longue duree restant (&gt; 6 ans)</li>
        <li><strong>Licence IV</strong> : ajoute 20 000 a 80 000 &#8364; de valeur (selon la ville)</li>
        <li><strong>Terrasse</strong> : terrasse permanente avec autorisation = prime significative</li>
        <li><strong>Equipe stable</strong> : personnel forme et fidele, chef salarie</li>
        <li><strong>Avis en ligne</strong> : note Google &gt; 4,3/5 avec volume &gt; 200 avis</li>
        <li><strong>Diversification</strong> : livraison, traiteur, evenementiel en complement</li>
      </ul>

      <h3>Facteurs negatifs (decotes)</h3>

      <ul>
        <li><strong>Dependance au chef-proprietaire</strong> : si le fondateur EST le produit (cuisine d&apos;auteur), decote de 15-30%</li>
        <li><strong>Bail precaire</strong> : bail de moins de 3 ans restant = forte decote</li>
        <li><strong>Mise aux normes</strong> : extraction, accessibilite, hygiene — a deduire du prix</li>
        <li><strong>Saisonnalite</strong> : CA concentre sur 6 mois (zone touristique) = decote de 10-20%</li>
        <li><strong>Absence de licence</strong> : pas de licence IV dans une zone ou les concurrents en ont une</li>
      </ul>

      <h2>Exemple complet de valorisation</h2>

      <p>Prenons un restaurant traditionnel a Lyon, 2 salaries :</p>

      <ul>
        <li>CA TTC : 450 000 &#8364;</li>
        <li>EBITDA comptable : 95 000 &#8364;</li>
        <li>Retraitement salaire gerant : -18 000 &#8364; (se verse 2 000 &#8364;/mois, marche a 3 500 &#8364;)</li>
        <li>Retraitement repas : -4 000 &#8364;</li>
        <li><strong>EBITDA retraite : 73 000 &#8364;</strong></li>
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
          <tr><td>% du CA (60-80%)</td><td>450k x 0,6 a 0,8</td><td>270 000 - 360 000 &#8364;</td></tr>
          <tr><td>Multiple EBITDA (4x)</td><td>73k x 4</td><td>292 000 &#8364;</td></tr>
          <tr><td>Multiple EBITDA (4,5x)</td><td>73k x 4,5</td><td>328 500 &#8364;</td></tr>
        </tbody>
      </table>

      <p>
        <strong>Fourchette de valorisation : 270 000 - 360 000 &#8364;</strong> (fonds de commerce, hors murs).
      </p>

      <p>
        Facteurs d&apos;ajustement : bail restant de 7 ans (positif), terrasse de 20 places (positif), pas de licence IV (negatif).
        Valorisation ajustee : <strong>300 000 - 350 000 &#8364;</strong>.
      </p>

      <h2>Fonds de commerce vs murs</h2>

      <p>
        Il est crucial de distinguer la valeur du <strong>fonds de commerce</strong> (droit au bail, clientele, materiel, enseigne) de la valeur des <strong>murs</strong> (l&apos;immobilier). Dans la majorite des cas, la vente porte uniquement sur le fonds de commerce.
      </p>

      <p>
        Si les murs sont inclus, il faut les valoriser separement (methode de capitalisation du loyer, generalement 6% a 8% en restauration).
      </p>

      <h2>Les erreurs courantes</h2>

      <ol>
        <li><strong>Valoriser sur le CA TTC brut</strong> sans retraiter l&apos;EBITDA — un CA de 500k&#8364; avec 5% de marge n&apos;a pas la meme valeur qu&apos;un CA de 500k&#8364; avec 15% de marge</li>
        <li><strong>Ignorer le bail</strong> : un bail a 3 ans de l&apos;echeance vaut beaucoup moins qu&apos;un bail a 9 ans</li>
        <li><strong>Surestimer le cash non declare</strong> : un acheteur prudent ne paiera pas pour des revenus non prouves</li>
        <li><strong>Oublier les investissements necessaires</strong> : cuisine a refaire, mise aux normes hygiene a prevoir</li>
        <li><strong>Confondre fonds et murs</strong> : le prix du fonds n&apos;inclut pas l&apos;immobilier</li>
      </ol>

      <h2>Liens utiles</h2>

      <ul>
        <li><Link href="/guide/valorisation-entreprise">Guide general de la valorisation d&apos;entreprise</Link></li>
        <li><Link href="/guide/methodes-valorisation">Les 5 methodes de valorisation expliquees</Link></li>
        <li><Link href="/guide/valorisation-commerce">Valorisation d&apos;un commerce</Link> (methode fonds de commerce)</li>
      </ul>

      <div className="mt-12 p-6 bg-[var(--accent-light)] border border-[var(--accent)]/20 rounded-[var(--radius-xl)] text-center">
        <p className="text-[var(--text-primary)] font-semibold mb-2">Valorisez votre restaurant en 10 minutes</p>
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
