import type { ConfigSecteur } from '../types'

export const SANTE: ConfigSecteur = {
  nom: 'Santé (Pharmacie, Laboratoire, Cabinet)',
  code: 'sante',

  codesNaf: [
    '47.73Z', // Commerce de détail de produits pharmaceutiques
    '86.21Z', // Activités des médecins généralistes
    '86.22A', // Activités de radiodiagnostic et de radiothérapie
    '86.22B', // Activités chirurgicales
    '86.22C', // Autres activités des médecins spécialistes
    '86.23Z', // Pratique dentaire
    '86.90A', // Ambulances
    '86.90B', // Laboratoires d'analyses médicales
    '86.90C', // Centres de collecte et banques d'organes
    '86.90D', // Activités des infirmiers et des sages-femmes
    '86.90E', // Activités des professionnels de la rééducation
    '86.90F', // Activités de santé humaine non classées ailleurs
  ],

  multiples: {
    ca: { min: 0.3, max: 1.0 }, // Très variable selon type
  },

  methodes: [
    { code: 'MULT_CA_SANTE', nom: 'Multiple CA (barème santé)', poids: 70 },
    { code: 'VALEUR_PATIENTELE', nom: 'Valeur de la patientèle', poids: 30 },
  ],

  questions: [
    "Quel est le type d'établissement ? (pharmacie, labo, cabinet)",
    'Combien de patients/clients actifs avez-vous ?',
    'Êtes-vous conventionné secteur 1 ou 2 ?',
    'Combien de praticiens/professionnels dans la structure ?',
    'Avez-vous des associés ?',
    "Quel est l'âge moyen de votre patientèle ?",
    'Êtes-vous propriétaire ou locataire des locaux ?',
    'Avez-vous du personnel salarié ?',
    'Quelle est la durée restante de votre bail ?',
    'Y a-t-il des confrères à proximité ?',
  ],

  facteursPrime: [
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
  ],

  facteursDecote: [
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
  ],

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

### Cas particulier : Pharmacie

Les pharmacies sont très codifiées :
- Valeur = 70-100% du CA HT
- + Stock à prix d'achat
- Licence d'exploitation (contingentée)
`,

  explicationMethodes: `
## Pourquoi ces méthodes pour la santé ?

### 1. Multiple CA barème santé (poids 70%)
C'est **LE standard** du secteur :
- Barèmes établis par les ordres professionnels
- Utilisés par les banques pour financer
- Reconnus par l'administration fiscale

**Barèmes indicatifs** :
- Pharmacie : 70-100% CA
- Laboratoire : 80-120% CA
- Médecin généraliste : 30-50% CA
- Spécialiste : 40-60% CA
- Dentiste : 40-60% CA
- Infirmier/Kiné : 30-50% CA

### 2. Valeur de la patientèle (poids 30%)
Pour **affiner** selon la qualité :
- Nombre de patients actifs
- Fidélité et ancienneté
- Potentiel de développement
`,
}
