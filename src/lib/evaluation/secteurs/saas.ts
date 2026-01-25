import type { ConfigSecteur } from '../types'

export const SAAS: ConfigSecteur = {
  nom: 'SaaS / Éditeur de logiciels',
  code: 'saas',

  codesNaf: [
    '62.01Z', // Programmation informatique
    '62.02A', // Conseil en systèmes et logiciels informatiques
    '62.02B', // Tierce maintenance de systèmes et d'applications informatiques
    '63.11Z', // Traitement de données, hébergement
    '58.29A', // Édition de logiciels système et de réseau
    '58.29B', // Édition de logiciels outils de développement et de langages
    '58.29C', // Édition de logiciels applicatifs
  ],

  multiples: {
    arr: { min: 3, max: 15 }, // Très variable selon croissance
    ebitda: { min: 8, max: 15 },
  },

  methodes: [
    { code: 'MULT_ARR', nom: 'Multiple ARR', poids: 70 },
    { code: 'MULT_EBITDA', nom: 'Multiple EBITDA', poids: 20 },
    { code: 'DCF', nom: 'DCF simplifié', poids: 10 },
  ],

  questions: [
    'Quel est votre MRR (Monthly Recurring Revenue) actuel ?',
    'Quel est votre ARR (Annual Recurring Revenue) ?',
    'Quelle est votre croissance sur les 12 derniers mois ?',
    'Quel est votre churn mensuel (% de clients perdus) ?',
    'Avez-vous du Net Revenue Retention > 100% (upsell) ?',
    "Quel est votre CAC (coût d'acquisition client) ?",
    'Quelle est la LTV (valeur vie client) moyenne ?',
    'Combien de clients payants actifs avez-vous ?',
    'Quelle est votre stack technique ? Avez-vous de la dette technique ?',
    'Quel % de votre CA est vraiment récurrent (abonnements) ?',
  ],

  facteursPrime: [
    {
      id: 'forte_croissance',
      description: 'Croissance > 50% par an',
      impact: '+50 à +100% sur le multiple',
      question: 'Votre ARR croît de plus de 50% par an ?',
    },
    {
      id: 'nrr_excellent',
      description: 'Net Revenue Retention > 120%',
      impact: '+20 à +30%',
      question: 'Vos clients existants dépensent plus chaque année (NRR > 120%) ?',
    },
    {
      id: 'churn_faible',
      description: 'Churn < 2% mensuel',
      impact: '+10 à +20%',
      question: 'Votre churn mensuel est inférieur à 2% ?',
    },
    {
      id: 'rule_of_40',
      description: 'Rule of 40 respectée',
      impact: '+15 à +25%',
      question: 'Croissance + Marge EBITDA > 40% ?',
    },
    {
      id: 'marche_large',
      description: 'Grand marché adressable (TAM)',
      impact: '+10 à +20%',
      question: 'Votre marché adressable dépasse 1 milliard € ?',
    },
  ],

  facteursDecote: [
    {
      id: 'churn_eleve',
      description: 'Churn > 5% mensuel',
      impact: '-30 à -50%',
      question: 'Votre churn mensuel dépasse 5% ?',
    },
    {
      id: 'concentration_clients',
      description: 'Top 3 clients > 50% ARR',
      impact: '-20 à -30%',
      question: "Vos 3 premiers clients représentent plus de 50% de l'ARR ?",
    },
    {
      id: 'dette_technique',
      description: 'Dette technique majeure',
      impact: '-15 à -25%',
      question: 'Avez-vous une dette technique importante à rembourser ?',
    },
    {
      id: 'dependance_fondateur',
      description: 'Dépendance au fondateur/CTO',
      impact: '-15 à -25%',
      question: 'Le produit dépend fortement du fondateur ou CTO ?',
    },
    {
      id: 'pas_vraiment_saas',
      description: 'Revenus non récurrents importants',
      impact: '-20 à -40%',
      question: 'Plus de 30% de vos revenus sont du one-shot (projets, services) ?',
    },
  ],

  explicationSecteur: `
## Comment évaluer un SaaS ?

Les entreprises SaaS ont une **méthode de valorisation très spécifique**, différente des entreprises traditionnelles.

### Les métriques qui comptent

1. **ARR (Annual Recurring Revenue)**
   - C'est LA métrique de base : vos revenus récurrents annualisés
   - ARR = MRR × 12
   - Seuls les revenus vraiment récurrents comptent (pas les projets one-shot)

2. **Croissance**
   - C'est le facteur #1 qui détermine le multiple
   - < 20%/an → multiple 2-4x ARR
   - 20-50%/an → multiple 4-8x ARR
   - 50-100%/an → multiple 7-12x ARR
   - > 100%/an → multiple 10-15x+ ARR

3. **Churn (taux d'attrition)**
   - % de clients ou de revenus perdus chaque mois
   - < 2%/mois = excellent
   - 2-5%/mois = acceptable
   - > 5%/mois = problème majeur qui détruit la valeur

4. **NRR (Net Revenue Retention)**
   - Mesure si vos clients existants dépensent plus ou moins chaque année
   - > 100% = vos clients dépensent plus (upsell, expansion)
   - > 120% = excellent, très valorisé
   - C'est le signe d'un produit qui crée de la valeur

5. **LTV/CAC**
   - LTV = valeur vie client
   - CAC = coût d'acquisition client
   - Ratio LTV/CAC > 3x = sain
   - Ratio LTV/CAC < 1x = vous perdez de l'argent à chaque client

### Pourquoi les multiples sont élevés ?

- **Revenus récurrents** : prévisibles et stables
- **Marges brutes élevées** : 70-90%
- **Scalabilité** : coûts marginaux quasi-nuls
- **Effets de réseau** possibles
`,

  explicationMethodes: `
## Pourquoi ces méthodes pour un SaaS ?

### 1. Multiple d'ARR (poids 70%)
C'est **LE standard** pour valoriser un SaaS :
- Tout le monde parle en multiple d'ARR dans la tech
- Le multiple dépend surtout de la **croissance**
- Permet de comparer avec les levées de fonds et acquisitions du marché

**Grille des multiples** :
| Croissance | Multiple ARR |
|------------|--------------|
| < 20% | 2-4x |
| 20-50% | 4-8x |
| 50-100% | 7-12x |
| > 100% | 10-15x+ |

**Ajustements** :
- NRR > 120% : +20%
- Churn > 5%/mois : -30%
- Rule of 40 OK : +15%

### 2. Multiple d'EBITDA (poids 20%)
Utilisé pour les SaaS **rentables et matures** :
- Pertinent quand la croissance ralentit
- Multiples de 8-15x EBITDA pour un SaaS rentable
- Moins utilisé pour les SaaS en hypercroissance non rentables

### 3. DCF simplifié (poids 10%)
Méthode de **validation** :
- Projette les flux de trésorerie futurs
- Utile pour vérifier la cohérence de la valorisation
- Très sensible aux hypothèses de croissance
`,
}
