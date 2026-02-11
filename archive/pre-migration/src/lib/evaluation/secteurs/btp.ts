import type { ConfigSecteur } from '../types'

export const BTP: ConfigSecteur = {
  nom: 'BTP / Artisanat du bâtiment',
  code: 'btp',

  codesNaf: [
    '41.20A', // Construction de maisons individuelles
    '41.20B', // Construction d'autres bâtiments
    '43.11Z', // Travaux de démolition
    '43.12A', // Travaux de terrassement courants
    '43.21A', // Travaux d'installation électrique
    '43.22A', // Travaux d'installation d'eau et de gaz
    '43.22B', // Travaux d'installation d'équipements thermiques
    '43.29A', // Travaux d'isolation
    '43.31Z', // Travaux de plâtrerie
    '43.32A', // Travaux de menuiserie bois et PVC
    '43.32B', // Travaux de menuiserie métallique et serrurerie
    '43.33Z', // Travaux de revêtement des sols et des murs
    '43.34Z', // Travaux de peinture et vitrerie
    '43.91A', // Travaux de charpente
    '43.91B', // Travaux de couverture
    '43.99A', // Travaux d'étanchéification
    '43.99B', // Travaux de montage de structures métalliques
    '43.99C', // Travaux de maçonnerie générale
    '43.99D', // Autres travaux spécialisés de construction
  ],

  multiples: {
    ca: { min: 0.2, max: 0.5 },
    ebitda: { min: 3, max: 5 },
  },

  methodes: [
    { code: 'MULT_EBITDA', nom: 'Multiple EBITDA', poids: 40 },
    { code: 'PRATICIENS', nom: 'Méthode des praticiens', poids: 30 },
    { code: 'VALEUR_MATERIEL', nom: 'Valeur du matériel', poids: 20 },
    { code: 'MULT_CA', nom: 'Multiple CA', poids: 10 },
  ],

  questions: [
    'Quelles certifications possédez-vous ? (RGE, Qualibat, etc.)',
    'Quel est votre carnet de commandes actuel ? Sur combien de mois ?',
    'Quelle est la valeur de votre parc matériel et véhicules ?',
    'Combien de salariés avez-vous ? Quelle est leur ancienneté ?',
    'Travaillez-vous principalement avec des particuliers ou des pros ?',
    'Avez-vous des marchés publics en cours ?',
    'Quel est le poids de vos 3 premiers clients dans le CA ?',
    'Avez-vous une garantie décennale en cours ?',
    'Le dirigeant travaille-t-il sur les chantiers ?',
    'Avez-vous des litiges ou sinistres en cours ?',
  ],

  facteursPrime: [
    {
      id: 'certifications',
      description: 'Certifications RGE, Qualibat',
      impact: '+10 à +20%',
      question: 'Êtes-vous certifié RGE et/ou Qualibat ?',
    },
    {
      id: 'carnet_plein',
      description: 'Carnet de commandes > 6 mois',
      impact: '+10 à +20%',
      question: 'Votre carnet de commandes dépasse 6 mois ?',
    },
    {
      id: 'equipe_stable',
      description: 'Équipe expérimentée et stable',
      impact: '+10 à +15%',
      question: "Vos salariés ont plus de 5 ans d'ancienneté en moyenne ?",
    },
    {
      id: 'marches_publics',
      description: 'Référencement marchés publics',
      impact: '+5 à +15%',
      question: 'Êtes-vous référencé pour les marchés publics ?',
    },
  ],

  facteursDecote: [
    {
      id: 'dependance_dirigeant',
      description: 'Dirigeant sur les chantiers',
      impact: '-20 à -40%',
      question: 'Le dirigeant est indispensable sur les chantiers ?',
    },
    {
      id: 'pas_certifications',
      description: 'Pas de certifications RGE',
      impact: '-10 à -20%',
      question: "Vous n'avez pas la certification RGE ?",
    },
    {
      id: 'litiges',
      description: 'Litiges ou sinistres en cours',
      impact: '-15 à -30%',
      question: 'Avez-vous des litiges ou sinistres décennale en cours ?',
    },
    {
      id: 'carnet_vide',
      description: 'Carnet de commandes < 2 mois',
      impact: '-15 à -25%',
      question: 'Votre carnet de commandes est inférieur à 2 mois ?',
    },
  ],

  explicationSecteur: `
## Comment évaluer une entreprise du BTP ?

Le BTP a une **forte composante humaine** et une **dépendance au dirigeant** souvent importante.

### Les éléments clés

1. **Les certifications**
   - RGE (Reconnu Garant de l'Environnement) : indispensable pour les aides
   - Qualibat : gage de qualité
   - Certifications spécifiques métier

2. **Le carnet de commandes**
   - Visibilité sur l'activité future
   - > 6 mois = très bien
   - < 2 mois = inquiétant

3. **L'équipe**
   - Compétences des salariés
   - Ancienneté et fidélité
   - Capacité à travailler sans le dirigeant

4. **Le matériel**
   - Véhicules, outillage, machines
   - Valeur de revente
   - État et ancienneté

5. **La dépendance au dirigeant**
   - C'est LE point critique dans le BTP
   - Si le patron est sur les chantiers → grosse décote
   - Il faut un manager/conducteur de travaux

### Risques spécifiques

- Garantie décennale : sinistres possibles pendant 10 ans
- Accidents du travail : secteur à risque
- Dépendance à quelques gros clients
`,

  explicationMethodes: `
## Pourquoi ces méthodes pour le BTP ?

### 1. Multiple d'EBITDA (poids 40%)
Méthode **principale** car :
- Mesure la rentabilité réelle
- Multiples de 3x à 5x
- Ajusté selon le carnet de commandes

### 2. Méthode des praticiens (poids 30%)
Pour **équilibrer** patrimoine et rentabilité :
- Prend en compte le matériel
- Reconnue par l'administration

### 3. Valeur du matériel (poids 20%)
Dans le BTP, le matériel a une **vraie valeur** :
- Véhicules utilitaires
- Outillage professionnel
- Machines spécialisées

### 4. Multiple de CA (poids 10%)
En **complément** seulement :
- Multiples de 0.2x à 0.5x
- Peu fiable si rentabilité variable
`,
}
