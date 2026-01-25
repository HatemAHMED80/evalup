import type { ConfigSecteur } from '../types'

export const ECOMMERCE: ConfigSecteur = {
  nom: 'E-commerce',
  code: 'ecommerce',

  codesNaf: [
    '47.91A', // Vente à distance sur catalogue général
    '47.91B', // Vente à distance sur catalogue spécialisé
    '47.99A', // Vente à domicile
    '47.99B', // Vente par automates et autres commerces de détail hors magasin
  ],

  multiples: {
    ca: { min: 0.5, max: 1.5 },
    ebitda: { min: 3, max: 6 },
  },

  methodes: [
    { code: 'MULT_MARGE_BRUTE', nom: 'Multiple de marge brute', poids: 40 },
    { code: 'MULT_EBITDA', nom: 'Multiple EBITDA', poids: 35 },
    { code: 'MULT_CA', nom: 'Multiple CA', poids: 25 },
  ],

  questions: [
    'Quel % de vos ventes passe par Amazon/marketplaces vs votre propre site ?',
    'Vendez-vous des produits de marque propre ou de la revente ?',
    'Quel est votre taux de retour ?',
    'Quel est votre panier moyen ?',
    'Combien de clients actifs (achat dans les 12 mois) avez-vous ?',
    'Quel est votre taux de réachat ?',
    "Quel est votre coût d'acquisition client (CAC) ?",
    'Gérez-vous votre propre stock ou êtes-vous en dropshipping ?',
    'Quelle est la valeur de votre stock actuel ?',
    'Avez-vous une base email/clients exploitable ?',
  ],

  facteursPrime: [
    {
      id: 'marque_propre',
      description: 'Marque propre (pas de revente)',
      impact: '+20 à +40%',
      question: 'Vendez-vous principalement des produits de votre marque ?',
    },
    {
      id: 'site_propre',
      description: 'Majorité des ventes sur site propre (pas Amazon)',
      impact: '+15 à +25%',
      question: 'Plus de 70% de vos ventes sont sur votre propre site ?',
    },
    {
      id: 'base_clients',
      description: 'Base clients importante et engagée',
      impact: '+10 à +20%',
      question: 'Avez-vous plus de 50 000 clients dans votre base email ?',
    },
    {
      id: 'fort_reachat',
      description: 'Taux de réachat élevé (> 30%)',
      impact: '+15 à +25%',
      question: "Plus de 30% de vos clients rachètent dans l'année ?",
    },
  ],

  facteursDecote: [
    {
      id: 'dependance_amazon',
      description: 'Dépendance Amazon (> 70% des ventes)',
      impact: '-25 à -40%',
      question: 'Plus de 70% de vos ventes passent par Amazon ?',
    },
    {
      id: 'dropshipping',
      description: '100% dropshipping (pas de stock)',
      impact: '-20 à -30%',
      question: 'Vous êtes en dropshipping sans stock propre ?',
    },
    {
      id: 'taux_retour_eleve',
      description: 'Taux de retour > 20%',
      impact: '-15 à -25%',
      question: 'Votre taux de retour dépasse 20% ?',
    },
    {
      id: 'pas_de_marque',
      description: 'Pure revente sans valeur ajoutée',
      impact: '-15 à -25%',
      question: 'Vous revendez des produits sans marque propre ni exclusivité ?',
    },
  ],

  explicationSecteur: `
## Comment évaluer un e-commerce ?

L'e-commerce a des **spécificités importantes** par rapport au commerce physique.

### Les critères clés

1. **Dépendance aux marketplaces**
   - Ventes Amazon vs site propre
   - Amazon peut couper votre compte du jour au lendemain
   - Site propre = plus de valeur car plus de contrôle

2. **Marque propre vs Revente**
   - Marque propre = marges plus élevées, plus défendable
   - Revente = facilement copiable, marges faibles
   - Exclusivités = valeur intermédiaire

3. **Stock vs Dropshipping**
   - Stock propre = investissement mais contrôle qualité
   - Dropshipping = peu de capital mais dépendance fournisseur
   - Le stock est un actif (ou un passif si invendable)

4. **Base clients**
   - Emails, comptes clients = actif précieux
   - Taux de réachat = indicateur de fidélité
   - CAC vs LTV = rentabilité de l'acquisition

### Marges typiques

- Marge brute : 30-60% selon produits
- Frais marketing : 15-40% du CA
- Logistique : 10-20% du CA
- Marge nette : 5-15%
`,

  explicationMethodes: `
## Pourquoi ces méthodes pour un e-commerce ?

### 1. Multiple de marge brute (poids 40%)
Méthode **pertinente** car :
- Le CA seul ne dit rien (marges très variables)
- La marge brute reflète la vraie valeur créée
- Multiples de 1x à 3x la marge brute annuelle

### 2. Multiple d'EBITDA (poids 35%)
Pour les e-commerces **rentables** :
- Multiples de 3x à 6x
- Plus élevé si marque propre et site propre
- Plus bas si dépendance Amazon

### 3. Multiple de CA (poids 25%)
En **complément** :
- 0.5-1x pour un e-commerce classique
- 1-1.5x pour une marque établie avec récurrence
`,
}
