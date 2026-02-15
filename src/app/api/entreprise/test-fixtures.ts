// Test fixtures for E2E testing — SIRENs starting with 901 return mock data
// Each fixture simulates a Pappers API response with realistic bilans

interface TestFixture {
  siren: string
  nom: string
  naf: string
  ville: string
  creation: string
  effectif: string
  lastYear: number
  ca: number
  resultatExploitation: number
  resultatNet: number
  tresorerie: number
  dettesFinancieres: number
  capitauxPropres: number
  dotationsAmortissements: number
  creancesClients: number
  stocks: number
  dettesFournisseurs: number
}

const FIXTURES: Record<string, TestFixture> = {
  '901000001': {
    siren: '901000001', nom: 'ROCKETFLOW', naf: '6201Z',
    ville: 'PARIS', creation: '15/06/2022', effectif: '10 à 19 salariés',
    lastYear: 2024, ca: 400000, resultatExploitation: -150000, resultatNet: -180000,
    tresorerie: 600000, dettesFinancieres: 0, capitauxPropres: 300000,
    dotationsAmortissements: 20000, creancesClients: 80000, stocks: 0, dettesFournisseurs: 30000,
  },
  '901000002': {
    siren: '901000002', nom: 'DATAWISE', naf: '6201Z',
    ville: 'LYON', creation: '03/01/2018', effectif: '50 à 99 salariés',
    lastYear: 2024, ca: 2500000, resultatExploitation: 600000, resultatNet: 450000,
    tresorerie: 700000, dettesFinancieres: 200000, capitauxPropres: 1200000,
    dotationsAmortissements: 100000, creancesClients: 400000, stocks: 0, dettesFournisseurs: 150000,
  },
  '901000003': {
    siren: '901000003', nom: 'TROQR', naf: '4791Z',
    ville: 'BORDEAUX', creation: '22/09/2021', effectif: '10 à 19 salariés',
    lastYear: 2024, ca: 600000, resultatExploitation: -50000, resultatNet: -70000,
    tresorerie: 400000, dettesFinancieres: 0, capitauxPropres: 250000,
    dotationsAmortissements: 15000, creancesClients: 50000, stocks: 0, dettesFournisseurs: 40000,
  },
  '901000004': {
    siren: '901000004', nom: 'MAISON ALBA', naf: '4791Z',
    ville: 'MARSEILLE', creation: '10/03/2019', effectif: '10 à 19 salariés',
    lastYear: 2024, ca: 1800000, resultatExploitation: 250000, resultatNet: 180000,
    tresorerie: 100000, dettesFinancieres: 120000, capitauxPropres: 400000,
    dotationsAmortissements: 30000, creancesClients: 200000, stocks: 150000, dettesFournisseurs: 100000,
  },
  '901000005': {
    siren: '901000005', nom: 'STRATEGIA CONSEIL', naf: '7022Z',
    ville: 'PARIS', creation: '01/06/2016', effectif: '3 à 5 salariés',
    lastYear: 2024, ca: 480000, resultatExploitation: 170000, resultatNet: 130000,
    tresorerie: 180000, dettesFinancieres: 0, capitauxPropres: 250000,
    dotationsAmortissements: 10000, creancesClients: 100000, stocks: 0, dettesFournisseurs: 20000,
  },
  '901000006': {
    siren: '901000006', nom: 'CLEANPRO SERVICES', naf: '8121Z',
    ville: 'TOULOUSE', creation: '15/09/2015', effectif: '50 à 99 salariés',
    lastYear: 2024, ca: 1400000, resultatExploitation: 230000, resultatNet: 170000,
    tresorerie: 250000, dettesFinancieres: 100000, capitauxPropres: 500000,
    dotationsAmortissements: 40000, creancesClients: 180000, stocks: 20000, dettesFournisseurs: 90000,
  },
  '901000007': {
    siren: '901000007', nom: 'BATISUD CONSTRUCTION', naf: '4120A',
    ville: 'NICE', creation: '01/01/2010', effectif: '250 à 499 salariés',
    lastYear: 2024, ca: 4800000, resultatExploitation: 180000, resultatNet: 120000,
    tresorerie: 80000, dettesFinancieres: 550000, capitauxPropres: 700000,
    dotationsAmortissements: 200000, creancesClients: 900000, stocks: 300000, dettesFournisseurs: 600000,
  },
  '901000008': {
    siren: '901000008', nom: 'LES SAVEURS DE JULIE', naf: '4711F',
    ville: 'NANTES', creation: '01/03/2017', effectif: '3 à 5 salariés',
    lastYear: 2024, ca: 780000, resultatExploitation: 110000, resultatNet: 80000,
    tresorerie: 40000, dettesFinancieres: 70000, capitauxPropres: 150000,
    dotationsAmortissements: 20000, creancesClients: 30000, stocks: 80000, dettesFournisseurs: 50000,
  },
  '901000009': {
    siren: '901000009', nom: 'DISTRIPHARMA', naf: '4646Z',
    ville: 'LILLE', creation: '01/01/2008', effectif: '50 à 99 salariés',
    lastYear: 2024, ca: 14000000, resultatExploitation: 550000, resultatNet: 380000,
    tresorerie: 350000, dettesFinancieres: 1100000, capitauxPropres: 2000000,
    dotationsAmortissements: 150000, creancesClients: 2500000, stocks: 1800000, dettesFournisseurs: 2000000,
  },
  '901000010': {
    siren: '901000010', nom: 'MECAPRECIS', naf: '2562A',
    ville: 'STRASBOURG', creation: '01/01/2005', effectif: '50 à 99 salariés',
    lastYear: 2024, ca: 3800000, resultatExploitation: 450000, resultatNet: 300000,
    tresorerie: 180000, dettesFinancieres: 900000, capitauxPropres: 1500000,
    dotationsAmortissements: 250000, creancesClients: 600000, stocks: 400000, dettesFournisseurs: 350000,
  },
  '901000011': {
    siren: '901000011', nom: 'FONCIÈRE DU SUD', naf: '6820A',
    ville: 'MONTPELLIER', creation: '01/06/2012', effectif: '0 salarié',
    lastYear: 2024, ca: 580000, resultatExploitation: 380000, resultatNet: 250000,
    tresorerie: 250000, dettesFinancieres: 2100000, capitauxPropres: 3500000,
    dotationsAmortissements: 120000, creancesClients: 60000, stocks: 0, dettesFournisseurs: 30000,
  },
  '901000012': {
    siren: '901000012', nom: 'STUDIO PIXEL', naf: '7410Z',
    ville: 'LYON', creation: '01/09/2019', effectif: '0 salarié',
    lastYear: 2024, ca: 110000, resultatExploitation: 75000, resultatNet: 60000,
    tresorerie: 40000, dettesFinancieres: 0, capitauxPropres: 80000,
    dotationsAmortissements: 5000, creancesClients: 20000, stocks: 0, dettesFournisseurs: 5000,
  },
  '901000013': {
    siren: '901000013', nom: 'JEAN DUPONT CONSULTANT', naf: '7022Z',
    ville: 'PARIS', creation: '01/01/2020', effectif: '0 salarié',
    lastYear: 2024, ca: 65000, resultatExploitation: 45000, resultatNet: 35000,
    tresorerie: 15000, dettesFinancieres: 0, capitauxPropres: 40000,
    dotationsAmortissements: 2000, creancesClients: 10000, stocks: 0, dettesFournisseurs: 3000,
  },
  '901000014': {
    siren: '901000014', nom: 'GROUPE ALPHA INVEST', naf: '6420Z',
    ville: 'PARIS', creation: '01/01/2015', effectif: '0 salarié',
    lastYear: 2024, ca: 180000, resultatExploitation: 140000, resultatNet: 1200000,
    tresorerie: 1800000, dettesFinancieres: 500000, capitauxPropres: 5000000,
    dotationsAmortissements: 50000, creancesClients: 30000, stocks: 0, dettesFournisseurs: 20000,
  },
  '901000015': {
    siren: '901000015', nom: 'NEURALMED', naf: '6201Z',
    ville: 'PARIS', creation: '01/06/2024', effectif: '3 à 5 salariés',
    lastYear: 2024, ca: 5000, resultatExploitation: -200000, resultatNet: -220000,
    tresorerie: 400000, dettesFinancieres: 50000, capitauxPropres: 150000,
    dotationsAmortissements: 10000, creancesClients: 2000, stocks: 0, dettesFournisseurs: 15000,
  },
}

export function getTestFixture(siren: string): TestFixture | null {
  return FIXTURES[siren] || null
}

export function buildTestResponse(f: TestFixture) {
  const ebitda = f.resultatExploitation + f.dotationsAmortissements
  const margeNette = f.ca > 0 ? (f.resultatNet / f.ca) * 100 : 0
  const margeEbitda = f.ca > 0 ? (ebitda / f.ca) * 100 : 0
  const ratioEndettement = f.capitauxPropres > 0 ? f.dettesFinancieres / f.capitauxPropres : 0

  const bilan = {
    annee: f.lastYear,
    chiffre_affaires: f.ca,
    resultat_exploitation: f.resultatExploitation,
    resultat_net: f.resultatNet,
    dotations_amortissements: f.dotationsAmortissements,
    tresorerie: f.tresorerie,
    stocks: f.stocks,
    creances_clients: f.creancesClients,
    capitaux_propres: f.capitauxPropres,
    dettes_financieres: f.dettesFinancieres,
    dettes_fournisseurs: f.dettesFournisseurs,
    provisions: 0,
  }

  const entreprise = {
    siren: f.siren,
    nom: f.nom,
    secteur: 'Services', // Will be overridden by detecterSecteur in real route
    codeNaf: f.naf,
    dateCreation: f.creation,
    effectif: f.effectif,
    adresse: '1 rue du Test',
    ville: f.ville,
    chiffreAffaires: f.ca,
  }

  return {
    entreprise,
    initialContext: {
      entreprise: {
        siren: f.siren,
        nom: f.nom,
        secteur: entreprise.secteur,
        codeNaf: f.naf,
        dateCreation: f.creation,
        effectif: f.effectif,
        adresse: entreprise.adresse,
        ville: f.ville,
      },
      financials: {
        bilans: [bilan],
        ratios: {
          margeNette: Math.round(margeNette * 10) / 10,
          margeEbitda: Math.round(margeEbitda * 10) / 10,
          ebitda,
          dso: f.ca > 0 ? Math.round((f.creancesClients / f.ca) * 365) : 0,
          ratioEndettement: Math.round(ratioEndettement * 100) / 100,
        },
        anomaliesDetectees: [],
      },
      documents: [],
      responses: {},
      evaluationProgress: {
        step: 1,
        completedTopics: [],
        pendingTopics: ['Découverte', 'Finances', 'Actifs', 'Équipe', 'Marché', 'Synthèse'],
      },
    },
  }
}
