import type { ConfigSecteur } from '../types'

export const INDUSTRIE: ConfigSecteur = {
  nom: 'Industrie / Manufacturing',
  code: 'industrie',

  codesNaf: [
    '10.11Z', // Transformation et conservation de viande de boucherie
    '10.12Z', // Transformation et conservation de viande de volaille
    '10.13A', // Préparation industrielle de produits à base de viande
    '10.20Z', // Transformation et conservation de poisson
    '10.31Z', // Transformation et conservation de pommes de terre
    '10.39A', // Autre transformation et conservation de légumes
    '10.51A', // Fabrication de lait liquide et de produits frais
    '10.71A', // Fabrication industrielle de pain
    '13.10Z', // Préparation de fibres textiles et filature
    '13.20Z', // Tissage
    '13.30Z', // Ennoblissement textile
    '20.11Z', // Fabrication de gaz industriels
    '20.12Z', // Fabrication de colorants et de pigments
    '20.13A', // Enrichissement et retraitement de matières nucléaires
    '22.11Z', // Fabrication et rechapage de pneumatiques
    '22.19Z', // Fabrication d'autres articles en caoutchouc
    '22.21Z', // Fabrication de plaques, feuilles, tubes et profilés en matières plastiques
    '22.22Z', // Fabrication d'emballages en matières plastiques
    '24.10Z', // Sidérurgie
    '24.20Z', // Fabrication de tubes, tuyaux
    '25.11Z', // Fabrication de structures métalliques
    '25.12Z', // Fabrication de portes et fenêtres en métal
    '25.21Z', // Fabrication de radiateurs et de chaudières
    '25.29Z', // Fabrication d'autres réservoirs
    '26.11Z', // Fabrication de composants électroniques
    '26.12Z', // Fabrication de cartes électroniques assemblées
    '27.11Z', // Fabrication de moteurs, génératrices
    '27.12Z', // Fabrication de matériel de distribution
    '28.11Z', // Fabrication de moteurs et turbines
    '28.12Z', // Fabrication d'équipements hydrauliques
    '29.10Z', // Construction de véhicules automobiles
    '29.20Z', // Fabrication de carrosseries
    '30.11Z', // Construction de navires
    '30.12Z', // Construction de bateaux de plaisance
    '31.01Z', // Fabrication de meubles de bureau
    '31.02Z', // Fabrication de meubles de cuisine
    '31.09A', // Fabrication de sièges d'ameublement d'intérieur
    '32.12Z', // Fabrication d'articles de joaillerie
    '32.13Z', // Fabrication d'articles de bijouterie fantaisie
  ],

  multiples: {
    ca: { min: 0.4, max: 0.8 },
    ebitda: { min: 4, max: 7 },
  },

  methodes: [
    { code: 'MULT_EBITDA', nom: 'Multiple EBITDA', poids: 40 },
    { code: 'DCF', nom: 'DCF simplifié', poids: 25 },
    { code: 'VALEUR_ACTIFS', nom: 'Valeur des actifs industriels', poids: 25 },
    { code: 'MULT_CA', nom: 'Multiple CA', poids: 10 },
  ],

  questions: [
    'Êtes-vous propriétaire des locaux industriels ?',
    'Quelle est la valeur de votre parc machines ?',
    "Quel est l'âge moyen de vos équipements ?",
    'Avez-vous des brevets ou savoir-faire propriétaires ?',
    'Quel est votre carnet de commandes actuel ?',
    "Travaillez-vous pour l'automobile, l'aéronautique, le luxe ?",
    'Avez-vous des certifications ISO ?',
    'Quelle est la part de vos 3 premiers clients ?',
    'Avez-vous des engagements environnementaux à respecter ?',
    'Des investissements machines sont-ils à prévoir ?',
  ],

  facteursPrime: [
    {
      id: 'brevets',
      description: 'Brevets ou savoir-faire exclusif',
      impact: '+15 à +30%',
      question: 'Possédez-vous des brevets ou un savoir-faire exclusif ?',
    },
    {
      id: 'certifications',
      description: 'Certifications ISO, sectorielles',
      impact: '+5 à +15%',
      question: 'Êtes-vous certifié ISO 9001, 14001 ou autres ?',
    },
    {
      id: 'immobilier',
      description: "Propriétaire de l'immobilier",
      impact: '+valeur de marché',
      question: 'Êtes-vous propriétaire des locaux ?',
    },
    {
      id: 'carnet_plein',
      description: 'Carnet de commandes > 6 mois',
      impact: '+10 à +15%',
      question: 'Votre carnet de commandes dépasse 6 mois ?',
    },
  ],

  facteursDecote: [
    {
      id: 'machines_obsoletes',
      description: 'Parc machines obsolète',
      impact: '-15 à -30%',
      question: 'Vos machines ont plus de 15 ans ou nécessitent un renouvellement ?',
    },
    {
      id: 'normes_environnement',
      description: 'Mises aux normes environnementales à prévoir',
      impact: '-10 à -25%',
      question: 'Devez-vous réaliser des investissements pour les normes environnementales ?',
    },
    {
      id: 'dependance_client',
      description: 'Dépendance à un donneur d\'ordre',
      impact: '-20 à -35%',
      question: 'Un client représente plus de 50% de votre CA ?',
    },
    {
      id: 'secteur_declin',
      description: 'Secteur en déclin',
      impact: '-15 à -25%',
      question: 'Votre marché est en déclin structurel ?',
    },
  ],

  explicationSecteur: `
## Comment évaluer une entreprise industrielle ?

L'industrie combine **actifs corporels importants** et **savoir-faire technique**.

### Les éléments clés

1. **Les actifs industriels**
   - Machines et équipements
   - Immobilier industriel
   - Stocks de matières premières et produits finis

2. **Le savoir-faire**
   - Brevets et propriété intellectuelle
   - Processus de fabrication
   - Certifications (ISO, sectorielles)

3. **Le carnet de commandes**
   - Visibilité sur l'activité
   - Qualité des clients (auto, aéro, luxe = prime)

4. **Les risques**
   - Obsolescence des équipements
   - Normes environnementales
   - Dépendance à quelques clients

### Investissements typiques

L'acheteur doit souvent prévoir :
- Renouvellement machines : 3-10% du CA/an
- Mise aux normes : variable
- R&D si technologique
`,

  explicationMethodes: `
## Pourquoi ces méthodes pour l'industrie ?

### 1. Multiple d'EBITDA (poids 40%)
La référence pour mesurer la **rentabilité** :
- Multiples de 4x à 7x
- Ajusté selon le carnet de commandes
- Attention aux CAPEX (investissements) nécessaires

### 2. DCF simplifié (poids 25%)
Pour **intégrer les investissements** futurs :
- Projette les flux sur 5 ans
- Déduit les investissements machines
- Plus réaliste pour l'industrie

### 3. Valeur des actifs (poids 25%)
L'industrie a des **actifs tangibles** importants :
- Machines à valoriser (valeur vénale)
- Immobilier si propriétaire
- Stocks (avec décote si rotation lente)

### 4. Multiple de CA (poids 10%)
En **complément** :
- Multiples de 0.4x à 0.8x
- Variable selon les sous-secteurs
`,
}
