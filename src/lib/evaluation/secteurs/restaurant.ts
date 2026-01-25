import type { ConfigSecteur } from '../types'

export const RESTAURANT: ConfigSecteur = {
  nom: 'Restauration',
  code: 'restaurant',

  codesNaf: [
    '56.10A', // Restauration traditionnelle
    '56.10B', // Cafétérias et autres libres-services
    '56.10C', // Restauration de type rapide
    '56.21Z', // Services des traiteurs
    '56.30Z', // Débits de boissons
  ],

  multiples: {
    ca: { min: 0.3, max: 0.8 },
    ebitda: { min: 2, max: 4 },
  },

  methodes: [
    { code: 'FONDS_COMMERCE', nom: 'Fonds de commerce', poids: 50 },
    { code: 'MULT_CA', nom: 'Multiple CA', poids: 30 },
    { code: 'MULT_EBITDA', nom: 'Multiple EBITDA', poids: 20 },
  ],

  questions: [
    'Êtes-vous propriétaire ou locataire des murs ?',
    'Quelle est la durée restante de votre bail commercial ?',
    'Quel est votre loyer annuel ?',
    'Possédez-vous une licence IV (débit de boissons) ?',
    'Quel est votre nombre de couverts par jour en moyenne ?',
    'Quel est votre ticket moyen ?',
    "Quelle est votre note Google et combien d'avis avez-vous ?",
    'Avez-vous une terrasse ? Combien de places ?',
    "Quel est l'état de votre matériel de cuisine (hotte, extraction, fours) ?",
    'Avez-vous des travaux de mise aux normes à prévoir ?',
  ],

  facteursPrime: [
    {
      id: 'licence_iv',
      description: 'Licence IV (débit de boissons)',
      impact: '+10 000 à +30 000€',
      question: 'Possédez-vous une licence IV ?',
    },
    {
      id: 'emplacement_premium',
      description: 'Emplacement premium (centre-ville, zone touristique)',
      impact: '+20 à +40%',
      question: 'Êtes-vous situé dans une zone à fort passage ?',
    },
    {
      id: 'terrasse',
      description: 'Terrasse exploitable',
      impact: '+10 à +20%',
      question: 'Avez-vous une terrasse avec autorisation ?',
    },
    {
      id: 'bonne_reputation',
      description: 'Excellente réputation (note > 4.5, nombreux avis)',
      impact: '+10 à +15%',
      question: 'Votre note Google est supérieure à 4.5 ?',
    },
    {
      id: 'bail_long',
      description: 'Bail commercial long (> 6 ans restants)',
      impact: '+5 à +10%',
      question: 'Il vous reste plus de 6 ans de bail ?',
    },
  ],

  facteursDecote: [
    {
      id: 'bail_court',
      description: 'Bail court (< 2 ans restants)',
      impact: '-20 à -40%',
      question: 'Il vous reste moins de 2 ans de bail ?',
    },
    {
      id: 'travaux_necessaires',
      description: 'Travaux de mise aux normes nécessaires',
      impact: '-10 à -30%',
      question: 'Des travaux de mise aux normes sont à prévoir ?',
    },
    {
      id: 'loyer_eleve',
      description: 'Loyer > 10% du CA',
      impact: '-15 à -25%',
      question: 'Votre loyer dépasse 10% de votre CA ?',
    },
    {
      id: 'mauvaise_reputation',
      description: 'Mauvaise réputation en ligne (note < 3.5)',
      impact: '-15 à -25%',
      question: 'Votre note Google est inférieure à 3.5 ?',
    },
    {
      id: 'dependance_chef',
      description: 'Forte dépendance au chef/patron',
      impact: '-10 à -20%',
      question: 'La clientèle vient principalement pour vous ?',
    },
  ],

  explicationSecteur: `
## Comment évaluer un restaurant ?

La restauration est un secteur où l'**emplacement** et le **fonds de commerce** sont primordiaux.

### Les éléments clés de valorisation

1. **L'emplacement**
   - C'est LE critère n°1 dans la restauration
   - Zone piétonne, centre-ville, zone touristique = prime
   - Zone industrielle, excentrée = décote

2. **Le bail commercial**
   - Durée restante cruciale (9 ans = bien, < 3 ans = risqué)
   - Loyer raisonnable = < 10% du CA
   - Clauses importantes : cession, activité, renouvellement

3. **La licence IV**
   - Permet de vendre de l'alcool (indispensable pour un bar/resto)
   - Valeur : 10 000€ à 30 000€ selon la ville
   - Les licences sont contingentées (nombre limité)

4. **Le matériel et l'aménagement**
   - Extraction/hotte : très coûteux à refaire (20-50k€)
   - Cuisine aux normes = valeur
   - Aménagement récent = valeur

5. **La réputation**
   - Note Google/TripAdvisor
   - Nombre d'avis
   - Présence sur les réseaux sociaux

### Marges typiques du secteur

- Marge brute (après coût matières) : 65-75%
- Coût matières : 25-35% du CA
- Charges de personnel : 30-40% du CA
- Loyer : 5-10% du CA
- Marge nette : 3-8%
`,

  explicationMethodes: `
## Pourquoi ces méthodes pour un restaurant ?

### 1. Valorisation du fonds de commerce (poids 50%)
C'est **la méthode traditionnelle** pour les commerces :
- On valorise les éléments corporels (matériel, aménagements)
- On ajoute les éléments incorporels (clientèle, emplacement, licence)
- Méthode reconnue par les tribunaux de commerce

**Composition** :
- Valeur clientèle = CA × multiple (0.3 à 0.8x)
- + Licence IV (10-30k€)
- + Matériel et équipement
- + Droit au bail (si favorable)

### 2. Multiple de CA (poids 30%)
Méthode **simple et courante** dans le secteur :
- Multiples de 30% à 80% du CA selon qualité
- Un restaurant rentable avec bon emplacement = 0.6-0.8x
- Un restaurant moyen = 0.3-0.5x

### 3. Multiple d'EBITDA (poids 20%)
Pour **valider par la rentabilité** :
- Multiples de 2x à 4x l'EBITDA
- Attention : beaucoup de restaurants ont un EBITDA faible
- Plus pertinent pour les établissements rentables
`,
}
