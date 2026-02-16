// Génération des données qualitatives pour le rapport PDF
// SWOT, analyse de marché et risques dérivés des données financières et sectorielles

import type { RatiosFinanciers } from '@/lib/analyse/ratios'
import type { SectorBenchmarks } from './sector-benchmarks'
import type { QualitativeData } from '@/lib/valuation/calculator-v2'

// ============================================
// DONNÉES SECTORIELLES
// ============================================

interface DonneesSecteur {
  tendances: string[]
  opportunites: string[]
  menaces: string[]
  clientele: string
  fournisseurs: string
}

const DONNEES_SECTEUR: Record<string, DonneesSecteur> = {
  transport: {
    tendances: [
      'Transition vers des flottes a faibles emissions (electriques, GNV)',
      'Consolidation du secteur par les grands groupes logistiques',
      'Digitalisation de la chaine logistique (TMS, tracking temps reel)',
      'Croissance du e-commerce stimulant la demande de transport du dernier kilometre',
    ],
    opportunites: [
      'Developpement de niches a forte valeur ajoutee (froid, exceptionnel, ADR)',
      'Partenariats avec des plateformes logistiques',
      'Investissement dans des vehicules verts pour capter les appels d\'offres publics',
    ],
    menaces: [
      'Penurie structurelle de chauffeurs qualifies',
      'Hausse des couts energetiques (carburant, electricite)',
      'Reglementation croissante (ZFE, normes Euro 7, RSE)',
      'Concurrence des plateformes de mise en relation',
    ],
    clientele: 'Donneurs d\'ordres industriels et logistiques, distributeurs, e-commercants. Le secteur est caracterise par des relations B2B avec des contrats cadre annuels ou pluriannuels.',
    fournisseurs: 'Constructeurs de vehicules (Renault Trucks, DAF, Scania), societes de leasing, fournisseurs de carburant. La dependance au cout du carburant (25-35% du CA) est un enjeu structurel.',
  },
  saas: {
    tendances: [
      'Acceleration de l\'adoption du cloud par les PME',
      'Consolidation du marche via des rachats par des fonds et editeurs majeurs',
      'Montee en puissance de l\'IA comme facteur de differenciation produit',
      'Pression accrue sur la protection des donnees (RGPD, AI Act)',
    ],
    opportunites: [
      'Expansion geographique facilitee par le modele 100% digital',
      'Upsell et cross-sell sur la base clients existante',
      'Integration d\'IA generative pour augmenter la valeur percue',
    ],
    menaces: [
      'Concurrence intense et compression des prix',
      'Churn client en cas de deterioration du produit ou du support',
      'Dependance aux grandes plateformes cloud (AWS, Azure)',
      'Evolution rapide des technologies rendant les produits obsoletes',
    ],
    clientele: 'PME et ETI en transformation digitale, grandes entreprises pour les solutions verticales. Le modele par abonnement (SaaS) implique un revenu recurrent avec un churn a surveiller.',
    fournisseurs: 'Hebergeurs cloud (AWS, GCP, Azure), prestataires DevOps, outils de developpement. Les couts d\'infrastructure representent 10-25% du CA.',
  },
  restaurant: {
    tendances: [
      'Croissance de la livraison a domicile et du click & collect',
      'Montee du bio, local et circuits courts dans les approvisionnements',
      'Inflation des matieres premieres et tensions sur les prix',
      'Difficulte de recrutement structurelle dans le secteur',
    ],
    opportunites: [
      'Developpement de la vente a emporter et livraison',
      'Diversification vers le traiteur ou l\'evenementiel',
      'Franchise ou duplication du concept si format reproductible',
    ],
    menaces: [
      'Penurie de personnel en salle et en cuisine',
      'Hausse des couts matieres premieres et energie',
      'Concurrence accrue des dark kitchens',
      'Reglementation sanitaire renforcee',
    ],
    clientele: 'Clientele locale et de passage (B2C), eventuellement entreprises pour la restauration collective. Le succes depend de l\'emplacement, la reputation et la fidelisation.',
    fournisseurs: 'Grossistes alimentaires, producteurs locaux, fournisseurs de boissons. Les achats representent 25-35% du CA.',
  },
  commerce: {
    tendances: [
      'Digitalisation des points de vente (click & collect, marketplace)',
      'Omnicanalite comme standard attendu par les consommateurs',
      'Pression sur les marges liee au e-commerce',
      'Montee en puissance du commerce responsable et seconde main',
    ],
    opportunites: [
      'Developpement d\'un canal e-commerce complementaire',
      'Creation d\'une marque propre a plus forte marge',
      'Experientialisation du point de vente physique',
    ],
    menaces: [
      'Concurrence frontale des geants du e-commerce',
      'Baisse de la frequentation en centre-ville',
      'Inflation et baisse du pouvoir d\'achat des consommateurs',
      'Evolution rapide des habitudes de consommation',
    ],
    clientele: 'Consommateurs finaux (B2C), mix de clientele locale et en ligne. Panier moyen et frequence d\'achat varient selon le segment.',
    fournisseurs: 'Grossistes, importateurs, fabricants. Les achats representent 55-70% du CA selon le type de commerce.',
  },
  commerce_gros: {
    tendances: [
      'Concentration du secteur via rachat de distributeurs par des groupes internationaux',
      'Digitalisation des commandes B2B (EDI, marketplaces professionnelles)',
      'Pression sur les marges liee a la transparence des prix',
      'Renforcement des reglementations sectorielles (tracabilite, normes sanitaires)',
    ],
    opportunites: [
      'Developpement de services a valeur ajoutee (logistique, conseil, formation)',
      'Expansion geographique via le e-commerce B2B',
      'Contrats exclusifs avec des marques ou fabricants',
    ],
    menaces: [
      'Desintermediation par les fabricants vendant en direct',
      'Pression prix des centrales d\'achat et groupements',
      'Concurrence des plateformes B2B (Amazon Business, Ankorstore)',
      'Hausse des couts logistiques et de stockage',
    ],
    clientele: 'Professionnels (B2B) : detaillants, restaurateurs, artisans, collectivites. Relations commerciales recurrentes avec commandes regulieres et conditions negociees.',
    fournisseurs: 'Fabricants, importateurs, producteurs. Les achats representent 75-90% du CA (marges fines structurelles). La relation fournisseur est cle pour la competitivite.',
  },
  ecommerce: {
    tendances: [
      'Croissance soutenue du e-commerce en France (+10% par an)',
      'Montee des couts d\'acquisition client (Meta Ads, Google Ads, TikTok)',
      'Pression reglementaire sur la logistique (emballages, retours, bilan carbone)',
      'Consolidation du marche via rachat de marques D2C par des groupes',
    ],
    opportunites: [
      'Expansion internationale facilitee par le modele 100% digital',
      'Developpement wholesale et corners en magasins physiques',
      'Abonnements et modeles recurrents pour stabiliser le chiffre d\'affaires',
    ],
    menaces: [
      'Hausse des couts d\'acquisition (CPM et CPC en croissance constante)',
      'Dependance aux plateformes publicitaires (Meta, Google, TikTok)',
      'Concurrence des marketplaces (Amazon, Temu) sur les prix',
      'Volatilite de la demande et saisonnalite forte',
    ],
    clientele: 'Consommateurs finaux (B2C), principalement acquis via les canaux digitaux (reseaux sociaux, SEO, email). La fidelisation et le taux de reachat sont des metriques cles de valorisation.',
    fournisseurs: 'Fabricants, fournisseurs de matieres premieres, prestataires logistiques (3PL), solutions e-commerce (Shopify, PrestaShop). Les couts logistiques representent 15-25% du CA.',
  },
  services: {
    tendances: [
      'Acceleration de la demande en conseil en transformation digitale',
      'Montee du travail a distance modifiant la relation client',
      'Consolidation du secteur par rachat de cabinets',
      'Pression tarifaire liee a la concurrence internationale',
    ],
    opportunites: [
      'Developpement de prestations recurrentes (abonnements, maintenance)',
      'Specialisation sectorielle a plus forte valeur ajoutee',
      'Internationalisation facilitee par le numerique',
    ],
    menaces: [
      'Dependance aux competences cles (key person risk)',
      'Concurrence des freelances et plateformes',
      'Pression sur les tarifs dans un marche mature',
      'Risque de perte de clients majeurs',
    ],
    clientele: 'Entreprises (B2B) de toutes tailles, administrations. La relation repose sur l\'expertise et la confiance. Contrats de mission ou recurrents.',
    fournisseurs: 'Sous-traitants specialises, outils logiciels, formation. Les charges de personnel representent 50-70% du CA.',
  },
  industrie: {
    tendances: [
      'Relocalisation et reindustrialisation encouragees par les pouvoirs publics',
      'Automatisation et industrie 4.0 (IoT, robotique)',
      'Transition energetique et decarbonation des processus',
      'Tensions sur les chaines d\'approvisionnement mondiales',
    ],
    opportunites: [
      'Modernisation de l\'outil de production pour gagner en competitivite',
      'Captation de marches de relocalisation',
      'Developpement de gammes a plus forte valeur ajoutee',
    ],
    menaces: [
      'Hausse des couts energetiques et matieres premieres',
      'Concurrence internationale (pays a bas couts)',
      'Obsolescence de l\'outil industriel',
      'Difficulte de recrutement sur les metiers techniques',
    ],
    clientele: 'Donneurs d\'ordres industriels, sous-traitance ou produit fini. Relations B2B souvent formalisees par des contrats cadre.',
    fournisseurs: 'Fournisseurs de matieres premieres, equipementiers, prestataires de maintenance. Les achats representent 40-60% du CA.',
  },
  btp: {
    tendances: [
      'Renovation energetique portee par les aides publiques (MaPrimeRenov)',
      'Dematerialisation des appels d\'offres et BIM',
      'Penurie de main d\'oeuvre qualifiee dans le batiment',
      'Hausse du cout des materiaux de construction',
    ],
    opportunites: [
      'Marche de la renovation energetique en forte croissance',
      'Specialisation dans les constructions bas carbone',
      'Developpement sur les marches publics locaux',
    ],
    menaces: [
      'Hausse des couts materiaux et sous-traitance',
      'Sinistralite et risques lies aux chantiers',
      'BFR eleve et risque de defaillance de donneurs d\'ordres',
      'Reglementation thermique de plus en plus exigeante',
    ],
    clientele: 'Particuliers (renovation), promoteurs, collectivites locales. Mix B2B/B2C avec des marches publics significatifs.',
    fournisseurs: 'Negociants en materiaux (Point P, Cedeo), loueurs de materiel, sous-traitants specialises.',
  },
  immobilier: {
    tendances: [
      'Remontee des taux d\'interet impactant les volumes de transactions',
      'Essor du coliving, coworking et immobilier flexible',
      'Reglementation energetique (DPE) modifiant la valorisation des biens',
      'Digitalisation de la transaction immobiliere',
    ],
    opportunites: [
      'Renovation de biens pour ameliorer le DPE et la valeur',
      'Diversification vers la gestion locative ou le viager',
      'Positionnement sur l\'immobilier durable et bas carbone',
    ],
    menaces: [
      'Hausse des taux d\'interet reduisant la capacite d\'emprunt des acheteurs',
      'Durcissement reglementaire (loi Climat, interdiction passoires thermiques)',
      'Volatilite des prix immobiliers',
      'Concurrence des plateformes digitales',
    ],
    clientele: 'Particuliers (achat/vente/location), investisseurs, entreprises. Marche fortement lie aux conditions de credit et a la conjoncture.',
    fournisseurs: 'Notaires, diagnostiqueurs, artisans renovation, banques. Le secteur est fortement intermedie.',
  },
  default: {
    tendances: [
      'Acceleration de la transformation digitale des PME',
      'Pression reglementaire croissante (RSE, RGPD, compliance)',
      'Consolidation sectorielle via des operations de croissance externe',
      'Montee des attentes en matiere de responsabilite sociale et environnementale',
    ],
    opportunites: [
      'Diversification des activites ou des marches',
      'Digitalisation pour ameliorer la productivite',
      'Developpement de partenariats strategiques',
    ],
    menaces: [
      'Pression concurrentielle et compression des marges',
      'Evolution reglementaire impactant les couts',
      'Difficulte de recrutement et fidelisation des talents',
      'Incertitude macroeconomique',
    ],
    clientele: 'Mix B2B/B2C selon l\'activite. La connaissance approfondie de la base client est un facteur cle de valorisation.',
    fournisseurs: 'Fournisseurs specialises selon l\'activite. La qualite et la diversification des approvisionnements sont des facteurs de resilience.',
  },
}

// ============================================
// GÉNÉRATION SWOT
// ============================================

export function genererSWOT(params: {
  pointsForts: string[]
  pointsVigilance: string[]
  ratios: RatiosFinanciers
  secteurCode: string
  benchmark: SectorBenchmarks
  qualitativeData?: QualitativeData
}): { forces: string[]; faiblesses: string[]; opportunites: string[]; menaces: string[] } {
  const { pointsForts, pointsVigilance, ratios, secteurCode, benchmark, qualitativeData } = params
  const donnees = DONNEES_SECTEUR[secteurCode] || DONNEES_SECTEUR.default

  // Forces : pointsForts + forces financières détectées + données qualitatives du chat
  const forces = [...pointsForts]
  if (ratios.margeEbitda >= benchmark.margeEbitda.max * 0.8 && !forces.some(f => /marge|ebitda/i.test(f))) {
    forces.push('Marge EBITDA superieure a la mediane du secteur')
  }
  // detteNetteEbitda n'est significatif que si l'EBITDA est positif
  if (ratios.margeEbitda > 0 && ratios.detteNetteEbitda < 1.5 && !forces.some(f => /dette|endettement/i.test(f))) {
    forces.push('Endettement maitrise permettant des investissements')
  }
  if (ratios.roe > 0.15 && !forces.some(f => /roe|capitaux/i.test(f))) {
    forces.push('Bonne rentabilite des capitaux propres')
  }
  // Forces issues du chat
  if (qualitativeData?.contratsCles && !forces.some(f => /contrat/i.test(f))) {
    forces.push('Contrats long terme securisant le chiffre d\'affaires')
  }
  if (qualitativeData?.dependanceDirigeant === 'faible' && !forces.some(f => /dirigeant|dependance/i.test(f))) {
    forces.push('Faible dependance au dirigeant facilitant la transmission')
  }
  if (qualitativeData?.concentrationClients != null && qualitativeData.concentrationClients < 20 && !forces.some(f => /client.*diversif/i.test(f))) {
    forces.push('Base clients diversifiee reduisant le risque commercial')
  }

  // Faiblesses : pointsVigilance + faiblesses financières + données qualitatives du chat
  const faiblesses = [...pointsVigilance]
  if (ratios.margeNette < benchmark.margeNette.min * 1.2 && !faiblesses.some(f => /marge.*nette/i.test(f))) {
    faiblesses.push('Marge nette sous la mediane du secteur')
  }
  if (ratios.dso > benchmark.dso.max * 0.9 && !faiblesses.some(f => /dso|client|delai/i.test(f))) {
    faiblesses.push('Delais de paiement clients eleves')
  }
  if (ratios.bfrSurCa > 0.25 && !faiblesses.some(f => /bfr/i.test(f))) {
    faiblesses.push('BFR eleve pesant sur la tresorerie')
  }
  // Faiblesses issues du chat
  if (qualitativeData?.litiges && !faiblesses.some(f => /litige|juridique/i.test(f))) {
    faiblesses.push('Procedures juridiques en cours pesant sur la valorisation')
  }
  if (qualitativeData?.dependanceDirigeant === 'forte' && !faiblesses.some(f => /dirigeant|dependance/i.test(f))) {
    faiblesses.push('Forte dependance au dirigeant, facteur de decote a la cession')
  }
  if (qualitativeData?.concentrationClients != null && qualitativeData.concentrationClients > 30 && !faiblesses.some(f => /concentration.*client/i.test(f))) {
    faiblesses.push(`Concentration client elevee (${qualitativeData.concentrationClients}% sur le premier client)`)
  }

  return {
    forces: forces.slice(0, 6),
    faiblesses: faiblesses.slice(0, 6),
    opportunites: donnees.opportunites.slice(0, 4),
    menaces: donnees.menaces.slice(0, 4),
  }
}

// ============================================
// GÉNÉRATION ANALYSE MARCHÉ
// ============================================

export function genererAnalyseMarche(params: {
  secteurCode: string
  benchmark: SectorBenchmarks
  ratios: RatiosFinanciers
  ca: number
  effectif: number | string
}): {
  tendances: string[]
  clientele: string
  fournisseurs: string
} {
  const donnees = DONNEES_SECTEUR[params.secteurCode] || DONNEES_SECTEUR.default

  return {
    tendances: donnees.tendances,
    clientele: donnees.clientele,
    fournisseurs: donnees.fournisseurs,
  }
}

// ============================================
// GÉNÉRATION RISQUES
// ============================================

export function genererRisques(params: {
  ratios: RatiosFinanciers
  secteurCode: string
  niveauConfiance: 'elevee' | 'moyenne' | 'faible'
  benchmark: SectorBenchmarks
  qualitativeData?: QualitativeData
}): { titre: string; description: string; niveau: 'faible' | 'moyen' | 'eleve' }[] {
  const { ratios, secteurCode, niveauConfiance, benchmark, qualitativeData } = params
  const risques: { titre: string; description: string; niveau: 'faible' | 'moyen' | 'eleve' }[] = []

  // 1. Risque de rentabilité
  if (ratios.margeNette < benchmark.margeNette.min) {
    risques.push({
      titre: 'Rentabilite insuffisante',
      description: `La marge nette (${(ratios.margeNette * 100).toFixed(1)}%) est inferieure au minimum sectoriel (${(benchmark.margeNette.min * 100).toFixed(0)}%). Cela limite la capacite d'autofinancement et la resilience face aux aleas.`,
      niveau: 'eleve',
    })
  } else if (ratios.margeNette < benchmark.margeNette.median) {
    risques.push({
      titre: 'Rentabilite a surveiller',
      description: `La marge nette est en dessous de la mediane sectorielle. Un effort d'optimisation des couts pourrait ameliorer la valorisation.`,
      niveau: 'moyen',
    })
  }

  // 2. Risque d'endettement
  if (ratios.ratioEndettement > 2.0) {
    risques.push({
      titre: 'Endettement eleve',
      description: `Le ratio d'endettement (${ratios.ratioEndettement.toFixed(1)}x) depasse le seuil de confort (2.0x). L'entreprise est vulnerable a une hausse des taux ou un retournement d'activite.`,
      niveau: 'eleve',
    })
  } else if (ratios.ratioEndettement > 1.0) {
    risques.push({
      titre: 'Endettement modere',
      description: `Le ratio d'endettement (${ratios.ratioEndettement.toFixed(1)}x) est dans la moyenne mais a surveiller en cas de besoin d'investissement.`,
      niveau: 'moyen',
    })
  } else {
    risques.push({
      titre: 'Structure financiere saine',
      description: `L'endettement (${ratios.ratioEndettement.toFixed(1)}x) est contenu, offrant une marge de manoeuvre pour financer la croissance.`,
      niveau: 'faible',
    })
  }

  // 3. Risque de trésorerie / BFR
  if (ratios.bfrSurCa > 0.25) {
    risques.push({
      titre: 'Pression sur la tresorerie',
      description: `Le BFR represente ${(ratios.bfrSurCa * 100).toFixed(0)}% du CA, ce qui immobilise une part significative des ressources. Un suivi rigoureux des delais clients/fournisseurs est necessaire.`,
      niveau: 'moyen',
    })
  }

  // 4. Risque de dépendance (key person) — utilise les données du chat si disponibles
  if (qualitativeData?.dependanceDirigeant) {
    const niveauMap: Record<string, 'faible' | 'moyen' | 'eleve'> = {
      faible: 'faible',
      moyenne: 'moyen',
      forte: 'eleve',
    }
    const descriptionMap: Record<string, string> = {
      faible: 'La dependance au dirigeant est evaluee comme faible. L\'entreprise dispose d\'une organisation permettant une transition maitrisee, ce qui est un atout pour la valorisation.',
      moyenne: 'La dependance au dirigeant est evaluee comme moyenne. Un plan de transition structure sur 6-12 mois serait recommande pour securiser la cession.',
      forte: 'La dependance au dirigeant est evaluee comme forte. L\'activite repose significativement sur le dirigeant, ce qui constitue un facteur de decote important (15-30%) et necessite un accompagnement post-cession prolonge.',
    }
    risques.push({
      titre: 'Dependance au dirigeant',
      description: descriptionMap[qualitativeData.dependanceDirigeant],
      niveau: niveauMap[qualitativeData.dependanceDirigeant],
    })
  } else {
    risques.push({
      titre: 'Dependance au dirigeant',
      description: 'Le degre de dependance au dirigeant actuel n\'a pas ete evalue en detail. Si l\'activite repose principalement sur le dirigeant, cela constitue un facteur de decote significatif.',
      niveau: niveauConfiance === 'faible' ? 'eleve' : 'moyen',
    })
  }

  // 5. Risque litiges juridiques (données du chat)
  if (qualitativeData?.litiges) {
    risques.push({
      titre: 'Litiges juridiques en cours',
      description: 'Des procedures juridiques en cours ont ete signalees. Elles peuvent generer des couts imprevus et constituer un frein pour un acquereur potentiel. Une provision adequate est recommandee.',
      niveau: 'eleve',
    })
  }

  // 6. Risque de concentration clients (données du chat)
  if (qualitativeData?.concentrationClients != null && qualitativeData.concentrationClients > 30) {
    risques.push({
      titre: 'Concentration du portefeuille clients',
      description: `Le premier client represente ${qualitativeData.concentrationClients}% du chiffre d'affaires. Cette dependance commerciale constitue un risque en cas de perte du client et un facteur de decote a la valorisation.`,
      niveau: qualitativeData.concentrationClients > 50 ? 'eleve' : 'moyen',
    })
  }

  // 7. Risques sectoriels
  const donnees = DONNEES_SECTEUR[secteurCode] || DONNEES_SECTEUR.default
  if (donnees.menaces.length > 0) {
    risques.push({
      titre: 'Risques sectoriels',
      description: `Principaux risques identifies pour le secteur ${(DONNEES_SECTEUR[secteurCode] || DONNEES_SECTEUR.default) === DONNEES_SECTEUR.default ? '' : `(${BENCHMARKS_NOMS[secteurCode] || secteurCode})`} : ${donnees.menaces.slice(0, 2).join(' ; ').toLowerCase()}.`,
      niveau: 'moyen',
    })
  }

  // 8. Risque de fiabilité des données
  if (niveauConfiance === 'faible') {
    risques.push({
      titre: 'Qualite des donnees limitee',
      description: 'L\'evaluation repose sur des donnees partielles ou peu coherentes. Les resultats doivent etre interpretes avec prudence et completes par une analyse approfondie.',
      niveau: 'eleve',
    })
  }

  return risques
}

// Noms des secteurs pour les descriptions de risques
const BENCHMARKS_NOMS: Record<string, string> = {
  transport: 'Transport Routier',
  saas: 'SaaS / Tech',
  restaurant: 'Restauration',
  commerce: 'Commerce / Retail',
  commerce_gros: 'Commerce de Gros / Distribution',
  ecommerce: 'E-commerce / D2C',
  services: 'Services / Conseil',
  industrie: 'Industrie / Production',
  btp: 'BTP / Construction',
  immobilier: 'Immobilier',
}
