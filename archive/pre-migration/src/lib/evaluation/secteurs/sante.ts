import type { ConfigSecteur } from '../types'

// ============================================
// BASE COMMUNE — Questions et facteurs partagés
// ============================================

const questionsBase = [
  'Combien de patients/clients actifs avez-vous ?',
  'Êtes-vous conventionné secteur 1 ou 2 ?',
  'Combien de praticiens/professionnels dans la structure ?',
  'Avez-vous des associés ?',
  "Quel est l'âge moyen de votre patientèle ?",
  'Êtes-vous propriétaire ou locataire des locaux ?',
  'Avez-vous du personnel salarié ?',
  'Quelle est la durée restante de votre bail ?',
  'Y a-t-il des confrères à proximité ?',
]

const facteursPrimeBase: ConfigSecteur['facteursPrime'] = [
  {
    id: 'monopole_local',
    description: 'Peu de concurrence locale',
    impact: '+10 à +20%',
    question: "Êtes-vous le seul praticien/établissement dans la zone ?",
  },
  {
    id: 'patientele_fidele',
    description: 'Patientèle fidèle et stable',
    impact: '+5 à +15%',
    question: 'Votre patientèle est fidèle depuis plusieurs années ?',
  },
  {
    id: 'locaux_modernes',
    description: 'Locaux modernes aux normes',
    impact: '+5 à +10%',
    question: 'Vos locaux sont récents et aux normes ?',
  },
]

const facteursDecoteBase: ConfigSecteur['facteursDecote'] = [
  {
    id: 'zone_surpeuplee',
    description: 'Zone avec forte concurrence',
    impact: '-15 à -25%',
    question: 'Il y a beaucoup de confrères dans votre zone ?',
  },
  {
    id: 'locaux_vetustes',
    description: 'Locaux vétustes, travaux à prévoir',
    impact: '-10 à -20%',
    question: 'Vos locaux nécessitent des travaux importants ?',
  },
  {
    id: 'reglementation',
    description: 'Évolutions réglementaires défavorables',
    impact: '-10 à -15%',
    question: 'Votre activité est menacée par des évolutions réglementaires ?',
  },
]

const explicationMethodesBase = `
### 1. Multiple CA barème santé (poids 70%)
C'est **LE standard** du secteur :
- Barèmes établis par les ordres professionnels
- Utilisés par les banques pour financer
- Reconnus par l'administration fiscale

### 2. Méthode des praticiens (poids 30%)
Pour **affiner** selon la qualité :
- Nombre de patients actifs
- Fidélité et ancienneté
- Potentiel de développement
`

// ============================================
// PHARMACIE — 47.73Z
// ============================================

export const PHARMACIE: ConfigSecteur = {
  nom: 'Pharmacie',
  code: 'pharmacie',

  codesNaf: [
    '47.73Z', // Commerce de détail de produits pharmaceutiques
  ],

  multiples: {
    ca: { min: 0.70, max: 1.00 },
  },

  methodes: [
    { code: 'BAREMES_SANTE', nom: 'Multiple CA (barème pharmacie)', poids: 70 },
    { code: 'PRATICIENS', nom: 'Méthode patrimoniale + rentabilité', poids: 30 },
  ],

  questions: [
    'Êtes-vous titulaire ou associé ?',
    'Combien d\'ordonnances traitez-vous par jour ?',
    'Quelle est la part de parapharmacie dans votre CA ?',
    'Êtes-vous en zone rurale ou urbaine ?',
    ...questionsBase,
  ],

  facteursPrime: [
    ...facteursPrimeBase,
    {
      id: 'licence_iv_pharma',
      description: 'Licence officine à forte valeur (zone protégée)',
      impact: '+10 à +20%',
      question: 'Votre officine bénéficie-t-elle d\'une zone de chalandise protégée ?',
    },
  ],

  facteursDecote: [
    ...facteursDecoteBase,
    {
      id: 'generiques',
      description: 'Fort impact des génériques sur la marge',
      impact: '-5 à -15%',
      question: 'La substitution par les génériques impacte-t-elle significativement votre marge ?',
    },
  ],

  explicationSecteur: `
## Comment évaluer une pharmacie ?

Les pharmacies sont **très codifiées** avec des barèmes reconnus par les banques et l'administration fiscale.

### Barème standard
- **70% à 100% du CA HT** (hors parapharmacie)
- + Stock à prix d'achat
- La licence d'exploitation est **contingentée** (nombre d'habitants)

### Les éléments clés

1. **La licence officinale** — contingentée, elle protège de la concurrence
2. **Le CA TTC/HT** — base de référence universelle
3. **La localisation** — zone rurale isolée = prime (monopole)
4. **Le stock** — valorisé en plus au prix d'achat
5. **Le personnel** — pharmaciens adjoints, préparateurs

### Spécificités
- Marge réglementée sur le médicament
- Impact croissant des génériques
- Ventes en ligne autorisées pour l'OTC
`,

  explicationMethodes: `
## Pourquoi ces méthodes pour une pharmacie ?

${explicationMethodesBase}

**Barèmes indicatifs pharmacie** :
- Pharmacie rurale monopole : 85-100% CA
- Pharmacie urbaine : 70-90% CA
- Pharmacie centre commercial : 65-85% CA
`,
}

// ============================================
// LABORATOIRE D'ANALYSES — 86.90B
// ============================================

export const LABO: ConfigSecteur = {
  nom: 'Laboratoire d\'analyses médicales',
  code: 'labo',

  codesNaf: [
    '86.90B', // Laboratoires d'analyses médicales
    '86.90C', // Centres de collecte et banques d'organes
  ],

  multiples: {
    ca: { min: 0.80, max: 1.20 },
  },

  methodes: [
    { code: 'BAREMES_SANTE', nom: 'Multiple CA (barème labo)', poids: 70 },
    { code: 'PRATICIENS', nom: 'Méthode des praticiens', poids: 30 },
  ],

  questions: [
    'Combien de sites de prélèvement avez-vous ?',
    'Quel est votre volume quotidien d\'analyses ?',
    'Faites-vous partie d\'un groupement ?',
    'Quelle est votre part de biologie spécialisée ?',
    ...questionsBase,
  ],

  facteursPrime: [
    ...facteursPrimeBase,
    {
      id: 'multi_sites',
      description: 'Réseau multi-sites de prélèvement',
      impact: '+10 à +20%',
      question: 'Avez-vous un réseau de sites de prélèvement (> 3 sites) ?',
    },
  ],

  facteursDecote: [
    ...facteursDecoteBase,
    {
      id: 'concentration_bio',
      description: 'Pression de regroupement des labos',
      impact: '-10 à -20%',
      question: 'Êtes-vous menacé par un regroupement ou rachat par un grand groupe ?',
    },
  ],

  explicationSecteur: `
## Comment évaluer un laboratoire d'analyses médicales ?

Les laboratoires d'analyses ont connu une **forte concentration** ces dernières années.

### Barème standard
- **80% à 120% du CA HT**
- Les grands groupes (Cerba, Biogroup, Inovie) rachètent à des multiples supérieurs

### Les éléments clés

1. **Le volume d'analyses** — économies d'échelle
2. **Le réseau de prélèvement** — maillage territorial
3. **La biologie spécialisée** — marge supérieure
4. **L'accréditation COFRAC** — obligatoire
5. **Les équipements analytiques** — coût de renouvellement
`,

  explicationMethodes: `
## Pourquoi ces méthodes pour un laboratoire ?

${explicationMethodesBase}

**Barèmes indicatifs labo** :
- Petit labo (< 2M€ CA) : 80-100% CA
- Labo moyen (2-10M€ CA) : 90-110% CA
- Gros labo multi-sites : 100-120% CA
`,
}

// ============================================
// CABINET MÉDECIN — 86.21Z, 86.22A-C
// ============================================

export const MEDECIN: ConfigSecteur = {
  nom: 'Cabinet médical (généraliste / spécialiste)',
  code: 'medecin',

  codesNaf: [
    '86.21Z', // Activités des médecins généralistes
    '86.22A', // Activités de radiodiagnostic et de radiothérapie
    '86.22B', // Activités chirurgicales
    '86.22C', // Autres activités des médecins spécialistes
  ],

  multiples: {
    ca: { min: 0.30, max: 0.60 },
  },

  methodes: [
    { code: 'BAREMES_SANTE', nom: 'Multiple CA (barème médecin)', poids: 70 },
    { code: 'PRATICIENS', nom: 'Méthode des praticiens', poids: 30 },
  ],

  questions: [
    'Êtes-vous médecin généraliste ou spécialiste ?',
    'Êtes-vous en secteur 1 (conventionné) ou secteur 2 (honoraires libres) ?',
    'Combien de consultations réalisez-vous par jour ?',
    'Exercez-vous en groupe ou seul ?',
    ...questionsBase,
  ],

  facteursPrime: [
    ...facteursPrimeBase,
    {
      id: 'secteur2',
      description: 'Secteur 2 avec dépassements d\'honoraires',
      impact: '+10 à +20%',
      question: 'Exercez-vous en secteur 2 avec des dépassements réguliers ?',
    },
  ],

  facteursDecote: [
    ...facteursDecoteBase,
    {
      id: 'medecin_seul',
      description: 'Exercice isolé sans associé',
      impact: '-10 à -20%',
      question: 'Exercez-vous seul sans associé ni remplaçant régulier ?',
    },
  ],

  explicationSecteur: `
## Comment évaluer un cabinet médical ?

La valeur d'un cabinet médical repose principalement sur **la patientèle**.

### Barèmes par spécialité
| Type | Multiple CA HT |
|------|----------------|
| **Généraliste** | 30% à 50% du CA |
| **Spécialiste** | 40% à 60% du CA |
| **Radiologue** | 50% à 70% du CA |

### Les éléments clés

1. **La patientèle** — nombre de patients actifs, fidélité
2. **La convention** — secteur 1 vs 2 (impact sur le prix)
3. **La localisation** — désert médical = prime, zone dense = décote
4. **Le matériel** — équipement spécialisé (imagerie, etc.)
5. **L'exercice en groupe** — plus valorisé que l'exercice solo
`,

  explicationMethodes: `
## Pourquoi ces méthodes pour un cabinet médical ?

${explicationMethodesBase}

**Barèmes indicatifs cabinet médical** :
- Généraliste secteur 1 : 30-40% CA
- Généraliste secteur 2 : 40-50% CA
- Spécialiste : 40-60% CA
`,
}

// ============================================
// CABINET DENTAIRE — 86.23Z
// ============================================

export const DENTAIRE: ConfigSecteur = {
  nom: 'Cabinet dentaire',
  code: 'dentaire',

  codesNaf: [
    '86.23Z', // Pratique dentaire
  ],

  multiples: {
    ca: { min: 0.40, max: 0.60 },
  },

  methodes: [
    { code: 'BAREMES_SANTE', nom: 'Multiple CA (barème dentaire)', poids: 70 },
    { code: 'PRATICIENS', nom: 'Méthode des praticiens', poids: 30 },
  ],

  questions: [
    'Quelle est la part de prothèses dans votre CA ?',
    'Avez-vous un plateau technique moderne (CFAO, panoramique, etc.) ?',
    'Combien de fauteuils dans le cabinet ?',
    'Exercez-vous seul ou en groupe ?',
    ...questionsBase,
  ],

  facteursPrime: [
    ...facteursPrimeBase,
    {
      id: 'equipement_moderne',
      description: 'Plateau technique moderne (CFAO, scanner)',
      impact: '+10 à +15%',
      question: 'Votre cabinet dispose d\'un plateau technique moderne (CFAO, cone beam) ?',
    },
  ],

  facteursDecote: [
    ...facteursDecoteBase,
    {
      id: 'equipement_obsolete',
      description: 'Équipement dentaire obsolète à renouveler',
      impact: '-15 à -25%',
      question: 'Votre matériel dentaire a plus de 10 ans et nécessite un renouvellement ?',
    },
  ],

  explicationSecteur: `
## Comment évaluer un cabinet dentaire ?

Le cabinet dentaire est valorisé en fonction de **la patientèle** et du **plateau technique**.

### Barème standard
- **40% à 60% du CA HT**
- + Valeur du matériel si moderne

### Les éléments clés

1. **La patientèle** — patients actifs, fidélité
2. **Le plateau technique** — fauteuils, CFAO, imagerie
3. **La part prothèses** — plus rentable mais sensible au prix
4. **La localisation** — accessibilité et concurrence
5. **L'exercice en groupe** — SCM, SCP ou SEL
`,

  explicationMethodes: `
## Pourquoi ces méthodes pour un cabinet dentaire ?

${explicationMethodesBase}

**Barèmes indicatifs cabinet dentaire** :
- Cabinet solo : 40-50% CA
- Cabinet de groupe : 45-60% CA
- Centre dentaire mutualiste : 30-45% CA
`,
}

// ============================================
// PARAMÉDICAL — 86.90A, 86.90D, 86.90E, 86.90F
// ============================================

export const PARAMEDICAL: ConfigSecteur = {
  nom: 'Paramédical (infirmier, kiné, ambulance)',
  code: 'paramedical',

  codesNaf: [
    '86.90A', // Ambulances
    '86.90D', // Activités des infirmiers et des sages-femmes
    '86.90E', // Activités des professionnels de la rééducation (kiné, ostéo)
    '86.90F', // Activités de santé humaine non classées ailleurs
  ],

  multiples: {
    ca: { min: 0.30, max: 0.50 },
  },

  methodes: [
    { code: 'BAREMES_SANTE', nom: 'Multiple CA (barème paramédical)', poids: 70 },
    { code: 'PRATICIENS', nom: 'Méthode des praticiens', poids: 30 },
  ],

  questions: [
    'Quel type d\'activité paramédicale exercez-vous ?',
    'Combien de patients actifs avez-vous ?',
    'Exercez-vous en libéral pur ou en mixte ?',
    'Avez-vous des contrats avec des établissements (EHPAD, cliniques) ?',
    ...questionsBase,
  ],

  facteursPrime: [
    ...facteursPrimeBase,
    {
      id: 'contrats_etablissements',
      description: 'Contrats avec établissements de santé',
      impact: '+5 à +15%',
      question: 'Avez-vous des contrats récurrents avec des EHPAD, cliniques ou hôpitaux ?',
    },
  ],

  facteursDecote: [
    ...facteursDecoteBase,
    {
      id: 'dependance_prescripteur',
      description: 'Dépendance à un seul prescripteur',
      impact: '-10 à -20%',
      question: 'Un seul médecin ou établissement représente l\'essentiel de vos prescriptions ?',
    },
  ],

  explicationSecteur: `
## Comment évaluer un cabinet paramédical ?

Les professions paramédicales (infirmier, kiné, ambulancier, sage-femme) ont des barèmes spécifiques.

### Barèmes par profession
| Type | Multiple CA HT |
|------|----------------|
| **Infirmier libéral** | 30% à 50% du CA |
| **Kinésithérapeute** | 30% à 50% du CA |
| **Ambulancier** | 40% à 60% du CA (+ véhicules) |
| **Sage-femme** | 30% à 45% du CA |

### Les éléments clés

1. **La patientèle / les tournées** — base de la valeur
2. **Les conventions** — sécurité du revenu
3. **Les contrats récurrents** — EHPAD, établissements
4. **Le matériel roulant** — ambulances, véhicules
5. **L'agrément** — pour les ambulances, contingentement
`,

  explicationMethodes: `
## Pourquoi ces méthodes pour le paramédical ?

${explicationMethodesBase}

**Barèmes indicatifs paramédical** :
- Infirmier libéral : 30-50% CA
- Kinésithérapeute : 30-50% CA
- Ambulancier : 40-60% CA + valeur véhicules
`,
}

// ============================================
// RÉTROCOMPATIBILITÉ — Export SANTE englobant
// ============================================

/**
 * @deprecated Utiliser PHARMACIE, LABO, MEDECIN, DENTAIRE, PARAMEDICAL
 * Conservé pour la rétrocompatibilité. Utilise les multiples les plus larges.
 */
export const SANTE: ConfigSecteur = {
  nom: 'Santé (Pharmacie, Laboratoire, Cabinet)',
  code: 'sante',

  // Tous les codes NAF santé (union des sous-secteurs)
  codesNaf: [
    ...PHARMACIE.codesNaf,
    ...LABO.codesNaf,
    ...MEDECIN.codesNaf,
    ...DENTAIRE.codesNaf,
    ...PARAMEDICAL.codesNaf,
  ],

  multiples: {
    ca: { min: 0.30, max: 1.20 }, // Range global (du paramédical à la pharmacie/labo)
  },

  methodes: [
    { code: 'BAREMES_SANTE', nom: 'Multiple CA (barème santé)', poids: 70 },
    { code: 'PRATICIENS', nom: 'Méthode des praticiens (patrimoine + rentabilité)', poids: 30 },
  ],

  questions: [
    "Quel est le type d'établissement ? (pharmacie, labo, cabinet)",
    ...questionsBase,
  ],

  facteursPrime: facteursPrimeBase,
  facteursDecote: facteursDecoteBase,

  explicationSecteur: `
## Comment évaluer un établissement de santé ?

Le secteur de la santé a des **barèmes très codifiés** qui varient selon le type d'établissement.

### Barèmes par type

| Type | Multiple CA HT |
|------|----------------|
| **Pharmacie** | 70% à 100% du CA |
| **Laboratoire d'analyses** | 80% à 120% du CA |
| **Cabinet médecin généraliste** | 30% à 50% du CA |
| **Cabinet médecin spécialiste** | 40% à 60% du CA |
| **Cabinet dentaire** | 40% à 60% du CA |
| **Cabinet infirmier** | 30% à 50% du CA |
| **Cabinet kiné** | 30% à 50% du CA |

### Les spécificités

1. **La patientèle**
   - C'est l'actif principal
   - Sa fidélité détermine la valeur
   - L'âge moyen compte (patientèle jeune = valeur)

2. **La réglementation**
   - Numerus clausus = protection
   - Conventionnement = sécurité
   - Évolutions réglementaires = risque

3. **Les locaux**
   - Normes d'accessibilité
   - Équipements spécifiques
   - Bail professionnel
`,

  explicationMethodes: `
## Pourquoi ces méthodes pour la santé ?

${explicationMethodesBase}
`,
}
