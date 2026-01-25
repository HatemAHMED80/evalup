import type { ConfigSecteur } from '../types'

export const COMMERCE: ConfigSecteur = {
  nom: 'Commerce de détail',
  code: 'commerce',

  codesNaf: [
    '47.11A', // Commerce de détail de produits surgelés
    '47.11B', // Commerce d'alimentation générale
    '47.11C', // Supérettes
    '47.11D', // Supermarchés
    '47.19A', // Grands magasins
    '47.19B', // Autres commerces de détail en magasin non spécialisé
    '47.21Z', // Commerce de détail de fruits et légumes
    '47.22Z', // Commerce de détail de viandes
    '47.23Z', // Commerce de détail de poissons
    '47.24Z', // Commerce de détail de pain, pâtisserie
    '47.25Z', // Commerce de détail de boissons
    '47.26Z', // Commerce de détail de produits à base de tabac
    '47.29Z', // Autres commerces de détail alimentaires
    '47.51Z', // Commerce de détail de textiles
    '47.71Z', // Commerce de détail d'habillement
    '47.72A', // Commerce de détail de la chaussure
    '47.72B', // Commerce de détail de maroquinerie
    '47.75Z', // Commerce de détail de parfumerie
    '47.76Z', // Commerce de détail de fleurs
    '47.77Z', // Commerce de détail d'articles d'horlogerie
    '47.78A', // Commerces de détail d'optique
    '47.78B', // Commerces de détail de charbons
    '47.78C', // Autres commerces de détail spécialisés
    '47.79Z', // Commerce de détail de biens d'occasion
  ],

  multiples: {
    ca: { min: 0.2, max: 0.5 },
    ebitda: { min: 2, max: 4 },
  },

  methodes: [
    { code: 'FONDS_COMMERCE', nom: 'Fonds de commerce + Stock', poids: 50 },
    { code: 'MULT_CA', nom: 'Multiple CA', poids: 30 },
    { code: 'MULT_EBITDA', nom: 'Multiple EBITDA', poids: 20 },
  ],

  questions: [
    'Êtes-vous franchisé ou indépendant ?',
    'Quelle est la surface de vente ?',
    'Êtes-vous propriétaire ou locataire des murs ?',
    'Quelle est la durée restante de votre bail ?',
    'Quelle est la valeur de votre stock actuel ?',
    'Quelle est la rotation de votre stock (nombre de jours) ?',
    'Quelle est votre zone de chalandise ?',
    'Avez-vous de la concurrence directe à proximité ?',
    'Quel est le panier moyen de vos clients ?',
    'Avez-vous une activité e-commerce complémentaire ?',
  ],

  facteursPrime: [
    {
      id: 'emplacement_n1',
      description: 'Emplacement n°1 (rue passante, centre commercial)',
      impact: '+15 à +25%',
      question: 'Êtes-vous situé dans un emplacement premium ?',
    },
    {
      id: 'franchise_connue',
      description: 'Franchise à forte notoriété',
      impact: '+10 à +20%',
      question: "Êtes-vous franchisé d'une enseigne connue ?",
    },
    {
      id: 'pas_de_concurrence',
      description: 'Peu de concurrence directe',
      impact: '+10 à +15%',
      question: 'Avez-vous peu de concurrents directs dans votre zone ?',
    },
    {
      id: 'omnicanal',
      description: 'Présence e-commerce',
      impact: '+5 à +10%',
      question: 'Avez-vous une activité de vente en ligne ?',
    },
  ],

  facteursDecote: [
    {
      id: 'stock_vieillissant',
      description: 'Stock avec invendus importants',
      impact: '-10 à -30% sur le stock',
      question: 'Avez-vous des invendus ou du stock ancien ?',
    },
    {
      id: 'bail_precaire',
      description: 'Bail précaire ou fin proche',
      impact: '-20 à -40%',
      question: 'Votre bail se termine dans moins de 2 ans ?',
    },
    {
      id: 'concurrence_forte',
      description: 'Forte concurrence (grande surface, e-commerce)',
      impact: '-15 à -25%',
      question: 'Subissez-vous une forte pression concurrentielle ?',
    },
    {
      id: 'dependance_fournisseur',
      description: 'Dépendance à un fournisseur unique',
      impact: '-10 à -15%',
      question: "Dépendez-vous fortement d'un seul fournisseur ?",
    },
  ],

  explicationSecteur: `
## Comment évaluer un commerce de détail ?

Le commerce de détail se valorise principalement sur son **fonds de commerce** et son **stock**.

### Les éléments clés

1. **L'emplacement et la zone de chalandise**
   - Flux piéton / voiture
   - Accessibilité, parking
   - Concurrence dans la zone

2. **Le bail commercial**
   - Durée restante
   - Loyer par rapport au CA (< 8% = bien)
   - Clauses de cession

3. **Le stock**
   - Valeur du stock = actif important
   - Mais attention aux invendus !
   - Valorisé généralement à 50-70% du prix d'achat

4. **Franchise vs Indépendant**
   - Franchise = notoriété mais contraintes
   - Indépendant = liberté mais moins de valeur de marque

### Formule typique

**Valeur = (CA × Multiple) + Stock valorisé**

Où :
- Multiple CA : 0.2x à 0.5x selon rentabilité
- Stock valorisé : 50-70% de la valeur d'achat (moins si invendus)
`,

  explicationMethodes: `
## Pourquoi ces méthodes pour un commerce ?

### 1. Fonds de commerce + Stock (poids 50%)
Méthode **traditionnelle** du secteur :
- Valeur du fonds = CA × multiple (0.2-0.5x)
- + Valeur du stock (avec décote si invendus)
- + Agencements et matériel

### 2. Multiple de CA (poids 30%)
Méthode **rapide** pour comparer :
- 0.2-0.3x pour un commerce en difficulté
- 0.3-0.4x pour un commerce moyen
- 0.4-0.5x pour un commerce rentable et bien situé

### 3. Multiple d'EBITDA (poids 20%)
Pour **valider la rentabilité** :
- Multiples de 2x à 4x
- Pertinent si le commerce est rentable
`,
}
