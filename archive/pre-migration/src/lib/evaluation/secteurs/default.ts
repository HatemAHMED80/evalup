import type { ConfigSecteur } from '../types'

export const DEFAULT: ConfigSecteur = {
  nom: 'Activité générale',
  code: 'default',
  codesNaf: [],

  multiples: {
    ca: { min: 0.3, max: 0.7 },
    ebitda: { min: 3, max: 6 },
  },

  methodes: [
    { code: 'MULT_EBITDA', nom: 'Multiple EBITDA', poids: 50 },
    { code: 'PRATICIENS', nom: 'Méthode des praticiens', poids: 30 },
    { code: 'MULT_CA', nom: 'Multiple CA', poids: 20 },
  ],

  questions: [
    'Quelle est la part de revenus récurrents dans votre activité ?',
    'Combien de clients représentent 50% de votre CA ?',
    'Quelle est la dépendance de l\'entreprise au dirigeant ?',
    'Avez-vous des actifs significatifs (immobilier, matériel) ?',
    'Quelle est la tendance de votre marché (croissance, stable, déclin) ?',
  ],

  facteursPrime: [
    {
      id: 'croissance',
      description: 'Forte croissance (> 15%/an)',
      impact: '+10 à +20%',
      question: 'Votre CA croît de plus de 15% par an ?',
    },
    {
      id: 'diversification',
      description: 'Portefeuille clients diversifié',
      impact: '+5 à +10%',
      question: 'Aucun client ne dépasse 15% du CA ?',
    },
    {
      id: 'recurrence',
      description: 'Revenus récurrents importants',
      impact: '+10 à +15%',
      question: 'Plus de 50% de vos revenus sont récurrents ?',
    },
  ],

  facteursDecote: [
    {
      id: 'dependance_dirigeant',
      description: 'Forte dépendance au dirigeant',
      impact: '-15 à -30%',
      question: 'L\'entreprise dépend fortement de vous ?',
    },
    {
      id: 'concentration_clients',
      description: 'Concentration clients (1 client > 30%)',
      impact: '-15 à -25%',
      question: 'Un client représente plus de 30% du CA ?',
    },
    {
      id: 'marche_declin',
      description: 'Marché en déclin',
      impact: '-10 à -20%',
      question: 'Votre marché est en déclin structurel ?',
    },
  ],

  explicationSecteur: `
## Comment évaluer une entreprise ?

L'évaluation d'une entreprise repose sur plusieurs critères fondamentaux :

### Les 3 piliers de la valorisation

1. **La rentabilité**
   - EBITDA = Excédent Brut d'Exploitation
   - C'est la capacité à générer du cash
   - C'est LE critère principal pour les acheteurs

2. **Les actifs**
   - Immobilier, matériel, stocks
   - Brevets, marques, clientèle
   - Trésorerie disponible

3. **Le potentiel**
   - Croissance du marché
   - Position concurrentielle
   - Capacité de développement

### Les risques à identifier

- Dépendance au dirigeant
- Concentration clients
- Évolution du marché
- Besoins d'investissement
`,

  explicationMethodes: `
## Les méthodes d'évaluation utilisées

### 1. Multiple d'EBITDA (poids 50%)
La méthode la plus utilisée par les professionnels :
- EBITDA = Résultat d'exploitation + Amortissements
- Multiple généralement entre 3x et 6x
- Ajusté selon le secteur et la taille

### 2. Méthode des praticiens (poids 30%)
Méthode reconnue par l'administration fiscale :
- Moyenne entre valeur patrimoniale et valeur de rentabilité
- Valeur patrimoniale = Actif Net Corrigé
- Valeur de rentabilité = Résultat × Coefficient

### 3. Multiple de CA (poids 20%)
Méthode de comparaison rapide :
- Utile pour situer l'entreprise dans le marché
- Multiples variables selon les secteurs
- Moins précise car ne tient pas compte de la rentabilité
`,
}
