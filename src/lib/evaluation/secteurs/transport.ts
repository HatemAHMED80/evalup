import type { ConfigSecteur } from '../types'

export const TRANSPORT: ConfigSecteur = {
  nom: 'Transport Routier de Marchandises',
  code: 'transport',

  codesNaf: [
    '49.41A', // Transports routiers de fret interurbains
    '49.41B', // Transports routiers de fret de proximité
    '49.41C', // Location de camions avec chauffeur
    '49.42Z', // Services de déménagement
  ],

  multiples: {
    ca: { min: 0.3, max: 0.6 },
    ebitda: { min: 3, max: 5 },
  },

  methodes: [
    { code: 'MULT_EBITDA', nom: 'Multiple EBITDA', poids: 40 },
    { code: 'VALEUR_FLOTTE', nom: 'Valeur de la flotte', poids: 30 },
    { code: 'PRATICIENS', nom: 'Méthode des praticiens', poids: 20 },
    { code: 'MULT_CA', nom: 'Multiple CA', poids: 10 },
  ],

  questions: [
    'Combien de véhicules possédez-vous en propre ? Et combien en leasing ?',
    "Quel est l'âge moyen de votre flotte ?",
    'Pouvez-vous estimer la valeur Argus de vos véhicules en propre ?',
    'Quelles licences de transport détenez-vous ? (intérieur, communautaire, léger, lourd)',
    'Quel est le poids de vos 3 premiers clients dans votre CA ?',
    'Avez-vous des contrats pluriannuels avec vos clients principaux ?',
    'Combien de chauffeurs employez-vous ? Quelle est leur ancienneté moyenne ?',
    "Faites-vous de l'affrètement (sous-traitance) ? Si oui, quelle proportion du CA ?",
  ],

  facteursPrime: [
    {
      id: 'flotte_recente',
      description: 'Flotte récente (< 3 ans)',
      impact: '+10 à +15%',
      question: 'Votre flotte a moins de 3 ans en moyenne ?',
    },
    {
      id: 'licences_communautaires',
      description: 'Licences communautaires',
      impact: '+5 à +10%',
      question: 'Détenez-vous des licences de transport communautaire ?',
    },
    {
      id: 'contrats_pluriannuels',
      description: 'Contrats clients long terme',
      impact: '+10 à +20%',
      question: 'Avez-vous des contrats cadre de plus de 2 ans ?',
    },
    {
      id: 'specialisation',
      description: 'Spécialisation (frigo, citerne, exceptionnel)',
      impact: '+10 à +15%',
      question: 'Êtes-vous spécialisé (transport frigorifique, citerne, convoi exceptionnel) ?',
    },
    {
      id: 'chauffeurs_fideles',
      description: 'Équipe de chauffeurs stable',
      impact: '+5 à +10%',
      question: "Vos chauffeurs ont-ils plus de 5 ans d'ancienneté en moyenne ?",
    },
  ],

  facteursDecote: [
    {
      id: 'flotte_vieille',
      description: 'Flotte vieillissante (> 7 ans)',
      impact: '-10 à -20%',
      question: "L'âge moyen de votre flotte dépasse 7 ans ?",
    },
    {
      id: 'tout_leasing',
      description: "100% leasing (pas d'actif)",
      impact: '-15 à -25%',
      question: 'Tous vos véhicules sont en leasing ?',
    },
    {
      id: 'concentration_clients',
      description: '1 client représente > 40% du CA',
      impact: '-15 à -25%',
      question: 'Un seul client représente plus de 40% de votre CA ?',
    },
    {
      id: 'turnover_chauffeurs',
      description: 'Fort turnover des chauffeurs',
      impact: '-10 à -15%',
      question: 'Avez-vous du mal à fidéliser vos chauffeurs ?',
    },
    {
      id: 'non_conforme',
      description: 'Flotte non conforme Euro 6',
      impact: '-10 à -15%',
      question: "Une partie de votre flotte n'est pas aux normes Euro 6 ?",
    },
  ],

  explicationSecteur: `
## Comment évaluer une entreprise de transport routier ?

Le transport routier a des **caractéristiques uniques** qui influencent fortement la valorisation :

### Les actifs clés

1. **La flotte de véhicules**
   - C'est souvent l'actif principal de l'entreprise
   - On distingue les véhicules **en propriété** (qui ont une valeur de revente) des véhicules **en leasing** (pas de valeur patrimoniale)
   - La valeur est basée sur l'Argus poids lourds, avec une décote selon l'âge et l'état

2. **Les licences de transport**
   - Licence intérieure (France uniquement)
   - Licence communautaire (Europe) - plus valorisée
   - Ces licences sont limitées et ont une vraie valeur

3. **Les contrats clients**
   - Un contrat pluriannuel avec un grand donneur d'ordre sécurise le CA
   - La diversification des clients réduit le risque

### Les risques spécifiques du secteur

- **Pénurie de chauffeurs** : difficulté à recruter, risque si départs
- **Coût du carburant** : impacte directement les marges (25-35% du CA)
- **Concentration clients** : dépendance aux grands donneurs d'ordre
- **Réglementation** : ZFE (zones faibles émissions), normes Euro, RSE

### Marges typiques du secteur

- Marge nette : 2-5%
- Marge EBITDA : 5-10%
- Une marge EBITDA > 8% est considérée comme bonne
`,

  explicationMethodes: `
## Pourquoi ces méthodes pour le transport routier ?

### 1. Multiple d'EBITDA (poids 40%)
C'est **LA méthode de référence** pour valoriser une entreprise de transport car :
- Elle mesure la capacité à générer du cash, indépendamment des choix comptables
- Elle permet de comparer avec d'autres entreprises du secteur
- Les multiples observés vont de **3x à 5x l'EBITDA**

**Formule** : Valeur = EBITDA × Multiple

### 2. Valeur de la flotte (poids 30%)
Dans le transport, les camions sont un **actif tangible majeur** :
- Un acheteur sait qu'il récupère des véhicules qu'il pourrait revendre
- La valeur est objective (Argus poids lourds)
- Attention : les véhicules en leasing ne comptent pas !

**Formule** : Valeur = Σ (Valeur Argus de chaque véhicule) - Décote âge + Prime licences

### 3. Méthode des praticiens (poids 20%)
Méthode de **validation** utilisée par les tribunaux et l'administration fiscale :
- Fait la moyenne entre patrimoine et rentabilité
- Donne un "filet de sécurité" à la valorisation

### 4. Multiple de CA (poids 10%)
Méthode **secondaire** car le CA seul ne dit rien sur la rentabilité :
- Utile pour comparer rapidement avec des transactions
- Multiples de **0.3x à 0.6x** selon la rentabilité
`,
}
