// Cas de test réalistes avec des entreprises fictives mais réalistes
// Chaque cas inclut toutes les réponses aux questions d'évaluation

export interface TestCompanyCase {
  // Identité
  id: string
  name: string
  description: string
  siren: string // SIREN valide pour Luhn

  // Données entreprise (ce qu'on attend de Pappers)
  expectedData: {
    secteur: string
    codeNaf: string
    effectif: string
    dateCreation: string
    formeJuridique: string
  }

  // Données financières déclarées
  financials: {
    ca: number
    resultatNet: number
    ebitda?: number
    tresorerie?: number
    dettes?: number
  }

  // Réponses aux questions Flash
  flashAnswers: {
    objectif: 'vente' | 'achat' | 'associe' | 'divorce' | 'transmission' | 'conflit' | 'financement' | 'pilotage'
    pedagogyLevel: 'novice' | 'intermediaire' | 'expert'
    hasDocuments: boolean
    // Réponses typiques aux questions
    responses: Record<string, string>
  }

  // Réponses aux questions Complète (après paiement)
  completeAnswers: {
    salaireDirigeant: string
    chargesExceptionnelles: string
    avantagesNature: string
    loyerAnormal: string
    risqueClient: string
    risqueFournisseur: string
    risqueHommeClé: string
    risqueReglementaire: string
    // etc.
    responses: Record<string, string>
  }

  // Valorisation attendue (fourchette)
  expectedValuation: {
    low: number
    high: number
    method: string
  }
}

// ============================================================
// CAS 1: Boulangerie traditionnelle - PME classique
// ============================================================
export const BOULANGERIE_MARTIN: TestCompanyCase = {
  id: 'boulangerie-martin',
  name: 'Boulangerie Martin',
  description: 'Boulangerie artisanale de centre-ville, 12 ans d\'ancienneté, propriétaire proche retraite',
  siren: '443061841', // SIREN valide

  expectedData: {
    secteur: 'Boulangerie-pâtisserie',
    codeNaf: '1071C',
    effectif: '5 à 9 salariés',
    dateCreation: '2012-03-15',
    formeJuridique: 'SARL',
  },

  financials: {
    ca: 485000,
    resultatNet: 72000,
    ebitda: 95000,
    tresorerie: 45000,
    dettes: 35000,
  },

  flashAnswers: {
    objectif: 'vente',
    pedagogyLevel: 'novice',
    hasDocuments: false,
    responses: {
      'activite_detail': 'Boulangerie artisanale avec fabrication sur place. On fait du pain traditionnel, des viennoiseries et de la pâtisserie. Environ 200 clients par jour.',
      'tendance_ca': 'Le CA est stable depuis 3 ans, légère hausse de 3% l\'an dernier grâce aux nouveaux produits bio.',
      'particularite': 'Emplacement numéro 1 sur la place du marché, bail renouvelé pour 9 ans. Pas de concurrent direct dans un rayon de 500m.',
      'motivation_vente': 'Je prends ma retraite dans 18 mois, je veux trouver un repreneur qui continuera l\'activité.',
      'effectif_detail': '6 salariés : 2 boulangers, 2 vendeuses, 1 pâtissier, 1 apprenti. Équipe stable depuis 5 ans.',
      'materiel': 'Four à sole récent (2020), pétrin, chambre de pousse. Investissement de 45000€ il y a 3 ans.',
    },
  },

  completeAnswers: {
    salaireDirigeant: 'Je me verse 4500€ brut par mois, soit environ 54000€ annuel plus les charges patronales.',
    chargesExceptionnelles: 'L\'année dernière j\'ai eu 8000€ de frais de contentieux avec un ancien salarié, c\'est exceptionnel.',
    avantagesNature: 'Je prends mes repas sur place, environ 3000€ par an. Pas de véhicule de fonction.',
    loyerAnormal: 'Le local m\'appartient en propre, je facture un loyer de 1500€/mois à la société.',
    risqueClient: 'Clientèle très diversifiée, aucun client ne fait plus de 1% du CA. Fidélité forte.',
    risqueFournisseur: 'Minoterie locale pour la farine (60% des achats), relation de confiance depuis 10 ans.',
    risqueHommeClé: 'Mon boulanger principal connaît toutes les recettes, il est là depuis 8 ans.',
    risqueReglementaire: 'RAS, toutes les normes HACCP sont respectées, dernier contrôle il y a 6 mois.',
    responses: {
      'recurrence_revenus': '95% du CA vient de clients récurrents du quartier.',
      'saisonnalite': 'Pic en décembre (+40%), creux en août (-30%) mais on reste ouvert.',
      'investissements_prevus': 'Pas d\'investissement majeur prévu, tout est en bon état.',
      'contentieux': 'Aucun contentieux en cours.',
      'garanties_donnees': 'Caution personnelle de 50000€ sur le prêt restant.',
    },
  },

  expectedValuation: {
    low: 180000,
    high: 280000,
    method: 'Multiple EBE 2-3x + stock',
  },
}

// ============================================================
// CAS 2: Agence web en croissance - Tech/Services
// ============================================================
export const AGENCE_DIGITALE: TestCompanyCase = {
  id: 'agence-digitale',
  name: 'WebFactory Studio',
  description: 'Agence web et marketing digital, 5 ans, forte croissance, dirigeant jeune',
  siren: '552032534', // Total (pour test avec vraie data)

  expectedData: {
    secteur: 'Programmation informatique',
    codeNaf: '6201Z',
    effectif: '10 à 19 salariés',
    dateCreation: '2019-06-01',
    formeJuridique: 'SAS',
  },

  financials: {
    ca: 890000,
    resultatNet: 125000,
    ebitda: 180000,
    tresorerie: 120000,
    dettes: 0,
  },

  flashAnswers: {
    objectif: 'vente',
    pedagogyLevel: 'intermediaire',
    hasDocuments: true,
    responses: {
      'activite_detail': 'Création de sites web, applications mobiles et stratégie marketing digital. Clients PME et ETI, contrats récurrents de maintenance.',
      'tendance_ca': 'Croissance de 35% par an depuis 3 ans. On passe de 650K à 890K cette année.',
      'particularite': 'Spécialisation e-commerce Shopify, on est partenaire certifié. Récurrence de 40% du CA en contrats de maintenance.',
      'motivation_vente': 'Je veux lever des fonds ou trouver un partenaire stratégique pour accélérer.',
      'effectif_detail': '12 personnes : 6 devs, 3 chefs de projet, 2 commerciaux, 1 admin. Turnover faible.',
      'materiel': 'Full remote, pas d\'immobilier. Outils SaaS (Figma, GitHub, Slack). Stack moderne.',
    },
  },

  completeAnswers: {
    salaireDirigeant: 'Je me verse 6000€ brut mensuel + prime de 20000€ si objectifs atteints.',
    chargesExceptionnelles: 'Rien d\'exceptionnel, peut-être 5000€ de formation certifiante pour l\'équipe.',
    avantagesNature: 'Pas de véhicule, télétravail pour tous. Tickets resto 200€/mois.',
    loyerAnormal: 'Pas de local, on est en coworking, 800€/mois tout compris.',
    risqueClient: '3 clients font 45% du CA : E-commerce Mode (20%), Groupe Resto (15%), Startup Fintech (10%).',
    risqueFournisseur: 'Dépendance aux plateformes (AWS, Shopify) mais pas de risque de rupture.',
    risqueHommeClé: 'Je suis le commercial principal et je gère les gros comptes. Lead dev très autonome.',
    risqueReglementaire: 'RGPD maîtrisé, on a un DPO externalisé.',
    responses: {
      'recurrence_revenus': '40% de récurrent (maintenance), 60% projets one-shot.',
      'pipeline_commercial': 'Carnet de commandes de 3 mois, pipeline de 500K€ en cours de négociation.',
      'technologie_propriétaire': 'Framework interne pour accélérer les devs Shopify, pas breveté.',
      'contentieux': 'Un litige en cours avec un client (15K€), provision faite.',
    },
  },

  expectedValuation: {
    low: 450000,
    high: 900000,
    method: 'Multiple CA 0.5-1x ou EBE 3-5x',
  },
}

// ============================================================
// CAS 3: Restaurant en difficulté - cas de restructuration
// ============================================================
export const RESTAURANT_DIFFICULTE: TestCompanyCase = {
  id: 'restaurant-difficulte',
  name: 'Le Petit Bistrot',
  description: 'Restaurant traditionnel post-COVID, CA en baisse, propriétaire épuisé',
  siren: '380129866', // Orange (pour test)

  expectedData: {
    secteur: 'Restauration traditionnelle',
    codeNaf: '5610A',
    effectif: '1 à 2 salariés',
    dateCreation: '2015-09-01',
    formeJuridique: 'EURL',
  },

  financials: {
    ca: 180000,
    resultatNet: -15000,
    ebitda: 5000,
    tresorerie: 8000,
    dettes: 65000,
  },

  flashAnswers: {
    objectif: 'vente',
    pedagogyLevel: 'novice',
    hasDocuments: false,
    responses: {
      'activite_detail': 'Restaurant de 40 couverts, cuisine traditionnelle française. Service midi et soir.',
      'tendance_ca': 'CA en baisse de 25% depuis le COVID, difficile de retrouver la clientèle du soir.',
      'particularite': 'Terrasse de 20 places en été, emplacement correct mais pas premium.',
      'motivation_vente': 'Je suis épuisé, 70h par semaine depuis 8 ans. Je veux partir avant de couler.',
      'effectif_detail': 'Juste moi en cuisine et ma femme en salle. Un extra le weekend.',
      'materiel': 'Équipement vieillissant, four et frigos ont 10 ans. Besoin de 30K€ d\'investissement.',
    },
  },

  completeAnswers: {
    salaireDirigeant: 'Je me verse 2000€ brut, ma femme 1500€. On vit dessus à peine.',
    chargesExceptionnelles: 'PGE de 40000€ à rembourser, j\'ai eu 2 ans de différé.',
    avantagesNature: 'On mange sur place, c\'est tout. Pas de véhicule.',
    loyerAnormal: 'Loyer de 2500€/mois, c\'est le prix du marché pour 80m² en centre-ville.',
    risqueClient: 'Clientèle de passage et quelques habitués. Pas de gros clients.',
    risqueFournisseur: 'Metro et Promocash, rien de particulier.',
    risqueHommeClé: 'Moi. Si je pars, tout s\'arrête. Ma femme ne peut pas gérer seule.',
    risqueReglementaire: 'Licence IV, dernière visite sanitaire OK mais des travaux à prévoir.',
    responses: {
      'recurrence_revenus': 'Très saisonnier, été = 60% du CA annuel grâce à la terrasse.',
      'dettes_detail': 'PGE 40K€, découvert 15K€, fournisseurs 10K€.',
      'actifs': 'Licence IV (valeur 15-20K€), matériel amorti.',
    },
  },

  expectedValuation: {
    low: 20000,
    high: 60000,
    method: 'Valeur liquidative + licence IV',
  },
}

// ============================================================
// CAS 4: Cabinet de conseil - services intellectuels
// ============================================================
export const CABINET_CONSEIL: TestCompanyCase = {
  id: 'cabinet-conseil',
  name: 'Stratego Consulting',
  description: 'Cabinet de conseil en stratégie, 3 associés, clientèle grands comptes',
  siren: '652014051', // Carrefour (pour test)

  expectedData: {
    secteur: 'Conseil en management',
    codeNaf: '7022Z',
    effectif: '3 à 5 salariés',
    dateCreation: '2017-01-15',
    formeJuridique: 'SAS',
  },

  financials: {
    ca: 1200000,
    resultatNet: 280000,
    ebitda: 350000,
    tresorerie: 200000,
    dettes: 0,
  },

  flashAnswers: {
    objectif: 'associe',
    pedagogyLevel: 'expert',
    hasDocuments: true,
    responses: {
      'activite_detail': 'Conseil en transformation digitale et stratégie pour ETI et grands comptes. Missions de 3-6 mois, TJM moyen de 1200€.',
      'tendance_ca': 'Croissance régulière de 15% par an. Très bonne visibilité avec des contrats-cadres.',
      'particularite': 'Expertise rare sur la transformation des DSI. 3 associés complémentaires.',
      'motivation_vente': 'Un des 3 associés veut sortir (40% du capital). On cherche un valorisation pour le rachat.',
      'effectif_detail': '3 associés + 2 consultants seniors. Pas de juniors, on sous-traite si besoin.',
      'materiel': 'Bureaux en location, full équipé. Pas d\'actifs corporels significatifs.',
    },
  },

  completeAnswers: {
    salaireDirigeant: 'Chaque associé se verse 8000€ brut + dividendes de 50-80K€ par an.',
    chargesExceptionnelles: 'Frais de déplacement importants (60K€/an) mais inclus dans les missions.',
    avantagesNature: 'Véhicule de fonction pour chaque associé (30K€ de leasing/an total).',
    loyerAnormal: 'Bureaux au marché, 3000€/mois pour 100m² à La Défense.',
    risqueClient: '5 clients font 70% du CA. Plus gros client = 25% (groupe industriel).',
    risqueFournisseur: 'Pas de dépendance, on achète peu.',
    risqueHommeClé: 'Les 3 associés sont tous clés. L\'associé sortant gère 30% du CA.',
    risqueReglementaire: 'RAS, pas de réglementation spécifique.',
    responses: {
      'recurrence_revenus': '60% en contrats-cadres annuels, 40% missions ponctuelles.',
      'non_concurrence': 'Clause de non-concurrence de 2 ans dans le pacte d\'associés.',
      'propriete_intellectuelle': 'Méthodologies propriétaires, pas de brevet.',
      'carnet_commandes': 'Pipeline de 800K€ signé pour les 6 prochains mois.',
    },
  },

  expectedValuation: {
    low: 800000,
    high: 1500000,
    method: 'Multiple EBE 2-4x avec décote homme-clé',
  },
}

// ============================================================
// Export de tous les cas
// ============================================================
export const ALL_TEST_CASES: TestCompanyCase[] = [
  BOULANGERIE_MARTIN,
  AGENCE_DIGITALE,
  RESTAURANT_DIFFICULTE,
  CABINET_CONSEIL,
]

// Fonction pour obtenir un cas par ID
export function getTestCase(id: string): TestCompanyCase | undefined {
  return ALL_TEST_CASES.find(c => c.id === id)
}

// Fonction pour obtenir une réponse réaliste selon le contexte
export function getRealisticAnswer(
  testCase: TestCompanyCase,
  questionType: string
): string {
  // Chercher d'abord dans les réponses flash
  if (testCase.flashAnswers.responses[questionType]) {
    return testCase.flashAnswers.responses[questionType]
  }
  // Puis dans les réponses complètes
  if (testCase.completeAnswers.responses[questionType]) {
    return testCase.completeAnswers.responses[questionType]
  }
  // Réponses par défaut selon le type de question
  const defaultAnswers: Record<string, string> = {
    'salaire_dirigeant': testCase.completeAnswers.salaireDirigeant,
    'charges_exceptionnelles': testCase.completeAnswers.chargesExceptionnelles,
    'avantages_nature': testCase.completeAnswers.avantagesNature,
    'loyer': testCase.completeAnswers.loyerAnormal,
    'risque_client': testCase.completeAnswers.risqueClient,
    'risque_fournisseur': testCase.completeAnswers.risqueFournisseur,
    'homme_cle': testCase.completeAnswers.risqueHommeClé,
    'reglementaire': testCase.completeAnswers.risqueReglementaire,
  }
  return defaultAnswers[questionType] || 'Je n\'ai pas cette information précise.'
}
