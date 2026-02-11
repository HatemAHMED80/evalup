import type { ConfigSecteur } from '../types'

export const SERVICES: ConfigSecteur = {
  nom: 'Services B2B / Conseil',
  code: 'services',

  codesNaf: [
    '70.10Z', // Activités des sièges sociaux
    '70.21Z', // Conseil en relations publiques et communication
    '70.22Z', // Conseil pour les affaires et autres conseils de gestion
    '73.11Z', // Activités des agences de publicité
    '73.12Z', // Régie publicitaire de médias
    '73.20Z', // Études de marché et sondages
    '74.10Z', // Activités spécialisées de design
    '74.20Z', // Activités photographiques
    '74.30Z', // Traduction et interprétation
    '74.90A', // Activité des économistes de la construction
    '74.90B', // Activités spécialisées, scientifiques et techniques diverses
    '78.10Z', // Activités des agences de placement de main-d'œuvre
    '78.20Z', // Activités des agences de travail temporaire
    '78.30Z', // Autre mise à disposition de ressources humaines
    '82.11Z', // Services administratifs combinés de bureau
    '82.19Z', // Photocopie, préparation de documents
    '82.20Z', // Activités de centres d'appels
    '82.30Z', // Organisation de foires, salons professionnels et congrès
    '82.99Z', // Autres activités de soutien aux entreprises
  ],

  multiples: {
    ca: { min: 0.5, max: 1.2 },
    ebitda: { min: 4, max: 7 },
  },

  methodes: [
    { code: 'MULT_EBITDA', nom: 'Multiple EBITDA', poids: 50 },
    { code: 'MULT_CA', nom: 'Multiple CA', poids: 30 },
    { code: 'PRATICIENS', nom: 'Méthode des praticiens', poids: 20 },
  ],

  questions: [
    'Quelle part de votre CA est récurrente (contrats, abonnements) ?',
    'Quelle est la durée moyenne de vos contrats clients ?',
    'Quel est le poids de vos 5 premiers clients dans le CA ?',
    'Quel est votre TJM (taux journalier moyen) ?',
    'Combien de consultants/salariés avez-vous ?',
    'Quel est le turnover annuel de vos équipes ?',
    'Le dirigeant est-il facturé sur des missions clients ?',
    'Avez-vous des processus et méthodes documentés ?',
    'Quelle est votre notoriété/marque dans votre domaine ?',
    'Avez-vous des partenariats exclusifs ?',
  ],

  facteursPrime: [
    {
      id: 'revenus_recurrents',
      description: 'Part récurrente > 50% du CA',
      impact: '+15 à +30%',
      question: 'Plus de 50% de votre CA est récurrent (contrats, maintenance) ?',
    },
    {
      id: 'diversification_clients',
      description: 'Clients diversifiés (top 5 < 40%)',
      impact: '+10 à +15%',
      question: 'Vos 5 premiers clients font moins de 40% du CA ?',
    },
    {
      id: 'equipe_autonome',
      description: 'Équipe autonome (dirigeant non facturé)',
      impact: '+15 à +25%',
      question: "L'entreprise tourne sans que le dirigeant soit sur les missions ?",
    },
    {
      id: 'marque_forte',
      description: 'Notoriété/marque reconnue',
      impact: '+10 à +20%',
      question: 'Votre marque est reconnue dans votre secteur ?',
    },
  ],

  facteursDecote: [
    {
      id: 'dependance_dirigeant',
      description: 'Dirigeant facturé sur missions',
      impact: '-20 à -40%',
      question: 'Le dirigeant réalise lui-même des missions facturées ?',
    },
    {
      id: 'concentration_clients',
      description: '1 client > 30% du CA',
      impact: '-15 à -25%',
      question: 'Un seul client représente plus de 30% de votre CA ?',
    },
    {
      id: 'turnover_eleve',
      description: 'Fort turnover des équipes',
      impact: '-10 à -20%',
      question: 'Votre turnover annuel dépasse 20% ?',
    },
    {
      id: 'pas_de_process',
      description: 'Pas de méthodes/processus documentés',
      impact: '-10 à -15%',
      question: 'Vos méthodes ne sont pas documentées ?',
    },
  ],

  explicationSecteur: `
## Comment évaluer une société de services B2B ?

Les services B2B (conseil, agences, ESN) ont une **valeur principalement immatérielle** : les équipes et les clients.

### Les critères clés

1. **La récurrence des revenus**
   - Contrats annuels/pluriannuels = valeur
   - Missions one-shot = moins de valeur
   - La récurrence sécurise le CA futur

2. **La dépendance au dirigeant**
   - Si le patron fait les missions → gros risque
   - Si l'équipe est autonome → valeur
   - Question clé : que se passe-t-il si le dirigeant part ?

3. **La diversification clients**
   - 1 gros client = risque
   - Portefeuille diversifié = sécurité

4. **Les équipes**
   - Compétences et expertise
   - Turnover (normal : 10-15%/an)
   - Documentation des méthodes

### Marges typiques

- Marge brute (après salaires directs) : 30-50%
- Marge EBITDA : 10-25%
- Une marge EBITDA > 15% est bonne dans le conseil
`,

  explicationMethodes: `
## Pourquoi ces méthodes pour les services B2B ?

### 1. Multiple d'EBITDA (poids 50%)
Méthode **principale** car :
- Les services ont peu d'actifs
- C'est la rentabilité qui compte
- Multiples de 4x à 7x selon récurrence

### 2. Multiple de CA (poids 30%)
Utile pour **comparer** :
- 0.5-0.8x pour du conseil classique
- 0.8-1.2x si forte récurrence
- Attention si marges faibles

### 3. Méthode des praticiens (poids 20%)
Pour **valider** :
- Souvent l'actif net est faible
- Donc le résultat dépend surtout de la rentabilité
`,
}
