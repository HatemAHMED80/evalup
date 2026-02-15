// tests/fixtures/scenarios.ts
// 15 scénarios de test — un par archétype
// Chaque scénario contient : les réponses au diagnostic, les données Pappers mockées,
// et les assertions de cohérence attendues.

export interface TestScenario {
  id: string;
  archetype: string;
  nom: string;
  siren: string;

  // Mock Pappers (ce que l'API Pappers retourne)
  pappers: {
    nom: string;
    siren: string;
    naf: string;
    ville: string;
    creation: string;
    effectifCode: string;
    lastYear: number;
    ca: number | null;
    resultatExploitation: number | null;
    resultatNet: number | null;
    tresorerie: number | null;
    dettesFinancieres: number | null;
  };

  // Réponses au diagnostic (ce que l'utilisateur saisit)
  diagnostic: {
    activityType: string;
    objectif: string;
    revenue: number;
    ebitda: number;
    growth: number;           // %
    recurring: number;        // %
    masseSalariale: number;   // % du CA
    effectif: string;
    remunerationDirigeant: number;
    concentrationClient: string;
    hasPatrimoine: boolean;
    loyersNets?: number;
    mrrMensuel?: number;
    churn?: number;           // % mensuel
    nrr?: number;             // %
    cac?: number;
    cacPayback?: number;      // mois
    runway?: number;          // mois
    tresorerieActuelle?: number;
    dettesFinancieres?: number;
  };

  // Assertions : ce qu'on vérifie
  expected: {
    note: string;
    confiance: string;
    valoMethod: string;
    warnings: string[];
    // Checks de cohérence qui DOIVENT se déclencher
    coherenceChecks: {
      check: string;
      result: string;
      severity: "error" | "warning" | "ok";
    }[];
  };
}

export const SCENARIOS: TestScenario[] = [

  // ═══════════════════════════════════════
  // 1. SAAS HYPER-CROISSANCE
  // ═══════════════════════════════════════
  {
    id: "saas_hyper",
    archetype: "saas_hyper",
    nom: "ROCKETFLOW",
    siren: "901000001",
    pappers: {
      nom: "ROCKETFLOW", siren: "901000001", naf: "62.01Z",
      ville: "PARIS", creation: "15/06/2022", effectifCode: "11",
      lastYear: 2024,
      ca: 400000, resultatExploitation: -150000, resultatNet: -180000,
      tresorerie: 600000, dettesFinancieres: 0,
    },
    diagnostic: {
      activityType: "saas",
      objectif: "levee",
      revenue: 800000,
      ebitda: -200000,
      growth: 95,
      recurring: 95,
      masseSalariale: 70,
      effectif: "6-20",
      remunerationDirigeant: 45000,
      concentrationClient: "<10%",
      hasPatrimoine: false,
      mrrMensuel: 70000,
      churn: 3,
      nrr: 130,
      cac: 800,
      cacPayback: 11,
      runway: 18,
    },
    expected: {
      note: "B+",
      confiance: "Moyenne",
      valoMethod: "ARR multiple (15-25x)",
      warnings: [
        "EBITDA négatif",
        "Burn rate élevé",
      ],
      coherenceChecks: [
        { check: "Écart CA vs Pappers = 100%", result: "Warning affiché", severity: "warning" },
        { check: "EBITDA négatif", result: "Signal burn rate, méthode ARR", severity: "warning" },
        { check: "ARR (840 000€) > CA (800 000€)", result: "Cohérent pour SaaS hyper", severity: "ok" },
        { check: "Note = B+", result: "Pas A (EBITDA négatif)", severity: "ok" },
        { check: "Confiance = Moyenne", result: "Pas élevée (burn rate)", severity: "ok" },
      ],
    },
  },

  // ═══════════════════════════════════════
  // 2. SAAS MATURE
  // ═══════════════════════════════════════
  {
    id: "saas_mature",
    archetype: "saas_mature",
    nom: "DATAWISE",
    siren: "901000002",
    pappers: {
      nom: "DATAWISE", siren: "901000002", naf: "62.01Z",
      ville: "LYON", creation: "03/01/2018", effectifCode: "21",
      lastYear: 2024,
      ca: 2500000, resultatExploitation: 600000, resultatNet: 450000,
      tresorerie: 700000, dettesFinancieres: 200000,
    },
    diagnostic: {
      activityType: "saas",
      objectif: "vente",
      revenue: 3000000,
      ebitda: 750000,
      growth: 20,
      recurring: 92,
      masseSalariale: 55,
      effectif: "21-50",
      remunerationDirigeant: 90000,
      concentrationClient: "10-30%",
      hasPatrimoine: false,
      mrrMensuel: 250000,
      churn: 1.5,
      nrr: 115,
      cac: 2000,
      cacPayback: 8,
      runway: 36,
    },
    expected: {
      note: "A",
      confiance: "Élevée",
      valoMethod: "ARR multiple (8-12x) + EBITDA",
      warnings: [],
      coherenceChecks: [
        { check: "Marge EBITDA = 25%", result: "Saine", severity: "ok" },
        { check: "LTV/CAC = 83x", result: "Excellent", severity: "ok" },
        { check: "Churn 1.5%/mois", result: "Correct pour SaaS mature", severity: "ok" },
        { check: "Note = A", result: "Tout est bon", severity: "ok" },
        { check: "Confiance = Élevée", result: "Données complètes + cohérentes", severity: "ok" },
      ],
    },
  },

  // ═══════════════════════════════════════
  // 3. MARKETPLACE
  // ═══════════════════════════════════════
  {
    id: "marketplace",
    archetype: "marketplace",
    nom: "TROQR",
    siren: "901000003",
    pappers: {
      nom: "TROQR", siren: "901000003", naf: "47.91Z",
      ville: "BORDEAUX", creation: "22/09/2021", effectifCode: "11",
      lastYear: 2024,
      ca: 600000, resultatExploitation: -50000, resultatNet: -70000,
      tresorerie: 400000, dettesFinancieres: 0,
    },
    diagnostic: {
      activityType: "marketplace",
      objectif: "levee",
      revenue: 1200000,
      ebitda: -100000,
      growth: 80,
      recurring: 60,
      masseSalariale: 50,
      effectif: "6-20",
      remunerationDirigeant: 50000,
      concentrationClient: "<10%",
      hasPatrimoine: false,
      mrrMensuel: 100000,
      churn: 5,
      nrr: 105,
      cac: 40,
      cacPayback: 4,
      runway: 14,
    },
    expected: {
      note: "B",
      confiance: "Moyenne",
      valoMethod: "GMV multiple + Take rate",
      warnings: [
        "EBITDA négatif",
        "Churn élevé (5%/mois)",
      ],
      coherenceChecks: [
        { check: "Écart CA vs Pappers = 100%", result: "Warning affiché", severity: "warning" },
        { check: "EBITDA négatif", result: "Normal marketplace en croissance", severity: "warning" },
        { check: "Churn 5%/mois", result: "Élevé — point vigilance", severity: "warning" },
      ],
    },
  },

  // ═══════════════════════════════════════
  // 4. E-COMMERCE D2C
  // ═══════════════════════════════════════
  {
    id: "ecommerce_d2c",
    archetype: "ecommerce_d2c",
    nom: "MAISON ALBA",
    siren: "901000004",
    pappers: {
      nom: "MAISON ALBA", siren: "901000004", naf: "47.91Z",
      ville: "MARSEILLE", creation: "10/03/2019", effectifCode: "11",
      lastYear: 2024,
      ca: 1800000, resultatExploitation: 250000, resultatNet: 180000,
      tresorerie: 100000, dettesFinancieres: 120000,
    },
    diagnostic: {
      activityType: "ecommerce",
      objectif: "vente",
      revenue: 2000000,
      ebitda: 300000,
      growth: 15,
      recurring: 30,
      masseSalariale: 25,
      effectif: "6-20",
      remunerationDirigeant: 60000,
      concentrationClient: "<10%",
      hasPatrimoine: false,
    },
    expected: {
      note: "B",
      confiance: "Élevée",
      valoMethod: "EBITDA multiple (4-6x)",
      warnings: [
        "Récurrence faible (30%)",
      ],
      coherenceChecks: [
        { check: "Récurrence 30%", result: "Faible pour valo premium", severity: "warning" },
        { check: "Marge EBITDA = 15%", result: "Correcte pour e-commerce", severity: "ok" },
      ],
    },
  },

  // ═══════════════════════════════════════
  // 5. CONSEIL / EXPERTISE
  // ═══════════════════════════════════════
  {
    id: "conseil_expertise",
    archetype: "conseil_expertise",
    nom: "STRATEGIA CONSEIL",
    siren: "901000005",
    pappers: {
      nom: "STRATEGIA CONSEIL", siren: "901000005", naf: "70.22Z",
      ville: "PARIS", creation: "01/06/2016", effectifCode: "02",
      lastYear: 2024,
      ca: 480000, resultatExploitation: 170000, resultatNet: 130000,
      tresorerie: 180000, dettesFinancieres: 0,
    },
    diagnostic: {
      activityType: "conseil",
      objectif: "associe",
      revenue: 500000,
      ebitda: 180000,
      growth: 8,
      recurring: 40,
      masseSalariale: 30,
      effectif: "2-5",
      remunerationDirigeant: 0,
      concentrationClient: "30-50%",
      hasPatrimoine: false,
    },
    expected: {
      note: "B-",
      confiance: "Moyenne",
      valoMethod: "EBITDA retraité (3-5x)",
      warnings: [
        "Rémunération dirigeant 0€ — EBITDA non représentatif",
        "Concentration client 30-50%",
      ],
      coherenceChecks: [
        { check: "Rému = 0€", result: "EBITDA gonfle la valo, retraitement obligatoire", severity: "error" },
        { check: "Concentration 30-50%", result: "Décote concentration", severity: "warning" },
        { check: "Marge EBITDA = 36%", result: "Fausse marge (rému non prise)", severity: "warning" },
        { check: "Confiance ≠ Élevée", result: "Pas élevée sans retraitements", severity: "ok" },
      ],
    },
  },

  // ═══════════════════════════════════════
  // 6. SERVICES RÉCURRENTS
  // ═══════════════════════════════════════
  {
    id: "services_recurrents",
    archetype: "services_recurrents",
    nom: "CLEANPRO SERVICES",
    siren: "901000006",
    pappers: {
      nom: "CLEANPRO SERVICES", siren: "901000006", naf: "81.21Z",
      ville: "TOULOUSE", creation: "15/09/2015", effectifCode: "21",
      lastYear: 2024,
      ca: 1400000, resultatExploitation: 230000, resultatNet: 170000,
      tresorerie: 250000, dettesFinancieres: 100000,
    },
    diagnostic: {
      activityType: "services",
      objectif: "vente",
      revenue: 1500000,
      ebitda: 250000,
      growth: 10,
      recurring: 80,
      masseSalariale: 60,
      effectif: "21-50",
      remunerationDirigeant: 70000,
      concentrationClient: "10-30%",
      hasPatrimoine: false,
    },
    expected: {
      note: "B+",
      confiance: "Élevée",
      valoMethod: "EBITDA multiple (5-7x)",
      warnings: [],
      coherenceChecks: [
        { check: "Marge EBITDA = 17%", result: "Correcte", severity: "ok" },
        { check: "Récurrence 80%", result: "Bon pour services", severity: "ok" },
        { check: "Masse salariale 60%", result: "Élevée mais cohérente services", severity: "ok" },
      ],
    },
  },

  // ═══════════════════════════════════════
  // 7. MASSE SALARIALE LOURDE
  // ═══════════════════════════════════════
  {
    id: "masse_salariale_lourde",
    archetype: "masse_salariale_lourde",
    nom: "BATISUD CONSTRUCTION",
    siren: "901000007",
    pappers: {
      nom: "BATISUD CONSTRUCTION", siren: "901000007", naf: "41.20A",
      ville: "NICE", creation: "01/01/2010", effectifCode: "32",
      lastYear: 2024,
      ca: 4800000, resultatExploitation: 180000, resultatNet: 120000,
      tresorerie: 80000, dettesFinancieres: 550000,
    },
    diagnostic: {
      activityType: "industrie",
      objectif: "vente",
      revenue: 5000000,
      ebitda: 200000,
      growth: 3,
      recurring: 20,
      masseSalariale: 75,
      effectif: "50+",
      remunerationDirigeant: 80000,
      concentrationClient: "10-30%",
      hasPatrimoine: true,
      loyersNets: 0,
    },
    expected: {
      note: "C+",
      confiance: "Élevée",
      valoMethod: "EBITDA multiple (3-4x) avec décote masse salariale",
      warnings: [
        "Masse salariale lourde (75%)",
        "Marge EBITDA faible (4%)",
        "Dettes élevées",
      ],
      coherenceChecks: [
        { check: "Masse sal 75%", result: "Décote risque social", severity: "warning" },
        { check: "Marge EBITDA = 4%", result: "Très faible", severity: "warning" },
        { check: "Dettes 550k > Tréso 80k", result: "Endettement net", severity: "warning" },
        { check: "Note ≤ C+", result: "Pas de B avec ces métriques", severity: "ok" },
      ],
    },
  },

  // ═══════════════════════════════════════
  // 8. COMMERCE RETAIL
  // ═══════════════════════════════════════
  {
    id: "commerce_retail",
    archetype: "commerce_retail",
    nom: "LES SAVEURS DE JULIE",
    siren: "901000008",
    pappers: {
      nom: "LES SAVEURS DE JULIE", siren: "901000008", naf: "47.11F",
      ville: "NANTES", creation: "01/03/2017", effectifCode: "02",
      lastYear: 2024,
      ca: 780000, resultatExploitation: 110000, resultatNet: 80000,
      tresorerie: 40000, dettesFinancieres: 70000,
    },
    diagnostic: {
      activityType: "commerce",
      objectif: "vente",
      revenue: 800000,
      ebitda: 120000,
      growth: 5,
      recurring: 50,
      masseSalariale: 35,
      effectif: "2-5",
      remunerationDirigeant: 50000,
      concentrationClient: "<10%",
      hasPatrimoine: false,
    },
    expected: {
      note: "B",
      confiance: "Élevée",
      valoMethod: "EBITDA multiple (3-5x)",
      warnings: [],
      coherenceChecks: [
        { check: "Marge EBITDA = 15%", result: "Correcte commerce", severity: "ok" },
        { check: "Profil standard", result: "Pas d'anomalie", severity: "ok" },
      ],
    },
  },

  // ═══════════════════════════════════════
  // 9. COMMERCE DE GROS
  // ═══════════════════════════════════════
  {
    id: "commerce_gros",
    archetype: "commerce_gros",
    nom: "DISTRIPHARMA",
    siren: "901000009",
    pappers: {
      nom: "DISTRIPHARMA", siren: "901000009", naf: "46.46Z",
      ville: "LILLE", creation: "01/01/2008", effectifCode: "21",
      lastYear: 2024,
      ca: 14000000, resultatExploitation: 550000, resultatNet: 380000,
      tresorerie: 350000, dettesFinancieres: 1100000,
    },
    diagnostic: {
      activityType: "commerce",
      objectif: "vente",
      revenue: 15000000,
      ebitda: 600000,
      growth: 7,
      recurring: 70,
      masseSalariale: 15,
      effectif: "21-50",
      remunerationDirigeant: 100000,
      concentrationClient: ">50%",
      hasPatrimoine: false,
    },
    expected: {
      note: "C+",
      confiance: "Moyenne",
      valoMethod: "EBITDA multiple (3-4x) avec décote concentration",
      warnings: [
        "Concentration critique >50%",
        "Marge EBITDA faible (4%)",
      ],
      coherenceChecks: [
        { check: "Concentration > 50%", result: "Décote majeure, point vigilance PDF", severity: "error" },
        { check: "Marge EBITDA = 4%", result: "Faible", severity: "warning" },
        { check: "Note ≤ C+", result: "Pas de B avec concentration >50%", severity: "ok" },
      ],
    },
  },

  // ═══════════════════════════════════════
  // 10. INDUSTRIE ASSET HEAVY
  // ═══════════════════════════════════════
  {
    id: "industrie_asset_heavy",
    archetype: "industrie_asset_heavy",
    nom: "MECAPRECIS",
    siren: "901000010",
    pappers: {
      nom: "MECAPRECIS", siren: "901000010", naf: "25.62A",
      ville: "STRASBOURG", creation: "01/01/2005", effectifCode: "21",
      lastYear: 2024,
      ca: 3800000, resultatExploitation: 450000, resultatNet: 300000,
      tresorerie: 180000, dettesFinancieres: 900000,
    },
    diagnostic: {
      activityType: "industrie",
      objectif: "vente",
      revenue: 4000000,
      ebitda: 500000,
      growth: 5,
      recurring: 60,
      masseSalariale: 40,
      effectif: "21-50",
      remunerationDirigeant: 85000,
      concentrationClient: "10-30%",
      hasPatrimoine: true,
      loyersNets: 0,
    },
    expected: {
      note: "B",
      confiance: "Élevée",
      valoMethod: "EBITDA multiple (4-6x) + valeur patrimoniale",
      warnings: [
        "Dettes significatives vs trésorerie",
      ],
      coherenceChecks: [
        { check: "Dettes 900k vs Tréso 180k", result: "Endettement net important", severity: "warning" },
        { check: "Marge EBITDA = 12.5%", result: "Correcte industrie", severity: "ok" },
      ],
    },
  },

  // ═══════════════════════════════════════
  // 11. IMMOBILIER / FONCIÈRE
  // ═══════════════════════════════════════
  {
    id: "immobilier_fonciere",
    archetype: "immobilier_fonciere",
    nom: "FONCIÈRE DU SUD",
    siren: "901000011",
    pappers: {
      nom: "FONCIÈRE DU SUD", siren: "901000011", naf: "68.20A",
      ville: "MONTPELLIER", creation: "01/06/2012", effectifCode: "00",
      lastYear: 2024,
      ca: 580000, resultatExploitation: 380000, resultatNet: 250000,
      tresorerie: 250000, dettesFinancieres: 2100000,
    },
    diagnostic: {
      activityType: "immobilier",
      objectif: "connaitre",
      revenue: 600000,
      ebitda: 400000,
      growth: 3,
      recurring: 95,
      masseSalariale: 5,
      effectif: "1",
      remunerationDirigeant: 60000,
      concentrationClient: "30-50%",
      hasPatrimoine: true,
      loyersNets: 400000,
    },
    expected: {
      note: "B",
      confiance: "Moyenne",
      valoMethod: "Capitalisation loyers (yield 5-8%) + ANR",
      warnings: [
        "Dettes élevées (levier immobilier)",
        "Concentration locataire 30-50%",
      ],
      coherenceChecks: [
        { check: "Dettes 2.1M vs Tréso 250k", result: "Levier immobilier classique", severity: "warning" },
        { check: "Concentration 30-50%", result: "Risque locataire", severity: "warning" },
        { check: "Marge EBITDA = 67%", result: "Normale immobilier", severity: "ok" },
      ],
    },
  },

  // ═══════════════════════════════════════
  // 12. MICRO RENTABLE
  // ═══════════════════════════════════════
  {
    id: "micro_rentable",
    archetype: "micro_rentable",
    nom: "STUDIO PIXEL",
    siren: "901000012",
    pappers: {
      nom: "STUDIO PIXEL", siren: "901000012", naf: "74.10Z",
      ville: "LYON", creation: "01/09/2019", effectifCode: "00",
      lastYear: 2024,
      ca: 110000, resultatExploitation: 75000, resultatNet: 60000,
      tresorerie: 40000, dettesFinancieres: 0,
    },
    diagnostic: {
      activityType: "conseil",
      objectif: "connaitre",
      revenue: 120000,
      ebitda: 80000,
      growth: 10,
      recurring: 50,
      masseSalariale: 0,
      effectif: "1",
      remunerationDirigeant: 0,
      concentrationClient: "30-50%",
      hasPatrimoine: false,
    },
    expected: {
      note: "C+",
      confiance: "Moyenne",
      valoMethod: "EBITDA retraité (1-3x) plafonné",
      warnings: [
        "Rémunération 0€ — EBITDA = rémunération du dirigeant",
        "Micro-activité (<150k)",
        "Concentration 30-50%",
        "Transférabilité faible (solo)",
      ],
      coherenceChecks: [
        { check: "Rému = 0€", result: "EBITDA 80k = salaire dirigeant déguisé", severity: "error" },
        { check: "CA < 150k", result: "Micro-activité, note plafonnée", severity: "warning" },
        { check: "Effectif = 1, masse sal = 0%", result: "Solo, pas transférable", severity: "warning" },
        { check: "Concentration 30-50%", result: "Risque perte client", severity: "warning" },
      ],
    },
  },

  // ═══════════════════════════════════════
  // 13. MICRO SOLO (NON VALORISABLE)
  // ═══════════════════════════════════════
  {
    id: "micro_solo",
    archetype: "micro_solo",
    nom: "JEAN DUPONT CONSULTANT",
    siren: "901000013",
    pappers: {
      nom: "JEAN DUPONT CONSULTANT", siren: "901000013", naf: "70.22Z",
      ville: "PARIS", creation: "01/01/2020", effectifCode: "00",
      lastYear: 2024,
      ca: 65000, resultatExploitation: 45000, resultatNet: 35000,
      tresorerie: 15000, dettesFinancieres: 0,
    },
    diagnostic: {
      activityType: "conseil",
      objectif: "connaitre",
      revenue: 70000,
      ebitda: 50000,
      growth: 0,
      recurring: 20,
      masseSalariale: 0,
      effectif: "1",
      remunerationDirigeant: 0,
      concentrationClient: ">50%",
      hasPatrimoine: false,
    },
    expected: {
      note: "D",
      confiance: "Faible",
      valoMethod: "Quasi nul — trésorerie + clientèle résiduelle",
      warnings: [
        "Rémunération 0€",
        "Micro < 100k",
        "Concentration > 50%",
        "Croissance 0%",
        "Non transférable",
        "Solo",
      ],
      coherenceChecks: [
        { check: "Rému = 0€", result: "EBITDA entièrement fictif", severity: "error" },
        { check: "CA < 100k", result: "Quasi non valorisable", severity: "error" },
        { check: "Concentration > 50%", result: "1 client = l'entreprise", severity: "error" },
        { check: "Croissance = 0%", result: "Stagnation", severity: "warning" },
        { check: "Récurrence 20%", result: "Pas de base stable", severity: "warning" },
        { check: "Note = D", result: "Pas de C avec ces métriques", severity: "ok" },
      ],
    },
  },

  // ═══════════════════════════════════════
  // 14. HOLDING / GESTION DE PATRIMOINE
  // ═══════════════════════════════════════
  {
    id: "holding_gestion",
    archetype: "holding_gestion",
    nom: "GROUPE ALPHA INVEST",
    siren: "901000014",
    pappers: {
      nom: "GROUPE ALPHA INVEST", siren: "901000014", naf: "64.20Z",
      ville: "PARIS", creation: "01/01/2015", effectifCode: "00",
      lastYear: 2024,
      ca: 180000, resultatExploitation: 140000, resultatNet: 1200000,
      tresorerie: 1800000, dettesFinancieres: 500000,
    },
    diagnostic: {
      activityType: "immobilier",
      objectif: "associe",
      revenue: 200000,
      ebitda: 150000,
      growth: 5,
      recurring: 90,
      masseSalariale: 5,
      effectif: "1",
      remunerationDirigeant: 80000,
      concentrationClient: "10-30%",
      hasPatrimoine: true,
      loyersNets: 120000,
    },
    expected: {
      note: "B",
      confiance: "Moyenne",
      valoMethod: "ANR (actif net réévalué) + rendement",
      warnings: [
        "CA faible vs trésorerie (profil holding)",
        "Valoriser les actifs, pas le CA",
      ],
      coherenceChecks: [
        { check: "CA 200k mais Tréso 1.8M", result: "Profil holding, pas opérationnel", severity: "warning" },
        { check: "RN 1.2M >> REX 140k", result: "Plus-values ou dividendes filiales", severity: "warning" },
        { check: "Méthode = ANR", result: "Pas EBITDA multiple", severity: "ok" },
      ],
    },
  },

  // ═══════════════════════════════════════
  // 15. STARTUP PRÉ-REVENU
  // ═══════════════════════════════════════
  {
    id: "startup_prerevenu",
    archetype: "startup_prerevenu",
    nom: "NEURALMED",
    siren: "901000015",
    pappers: {
      nom: "NEURALMED", siren: "901000015", naf: "62.01Z",
      ville: "PARIS", creation: "01/06/2024", effectifCode: "02",
      lastYear: 2024,
      ca: 5000, resultatExploitation: -200000, resultatNet: -220000,
      tresorerie: 400000, dettesFinancieres: 50000,
    },
    diagnostic: {
      activityType: "saas",
      objectif: "levee",
      revenue: 20000,
      ebitda: -300000,
      growth: 100,
      recurring: 80,
      masseSalariale: 80,
      effectif: "2-5",
      remunerationDirigeant: 30000,
      concentrationClient: ">50%",
      hasPatrimoine: false,
      mrrMensuel: 2000,
      churn: 15,
      nrr: 80,
      cac: 500,
      cacPayback: 250,
      runway: 5,
    },
    expected: {
      note: "D+",
      confiance: "Faible",
      valoMethod: "DCF si projection crédible, sinon non valorisable par multiples",
      warnings: [
        "Pré-revenu (CA 20k)",
        "EBITDA très négatif (-300k)",
        "Churn 15%/mois (catastrophique)",
        "Runway 5 mois (critique)",
        "Concentration > 50%",
        "NRR 80% (shrink)",
      ],
      coherenceChecks: [
        { check: "CA = 20k", result: "Pré-revenu, pas de multiple applicable", severity: "error" },
        { check: "EBITDA = -300k", result: "Burn rate sans revenu", severity: "error" },
        { check: "Churn = 15%/mois", result: "Perd 85% des clients/an", severity: "error" },
        { check: "Runway = 5 mois", result: "Survie menacée", severity: "error" },
        { check: "NRR = 80%", result: "Revenue shrink", severity: "warning" },
        { check: "LTV/CAC = 0.3x", result: "Unit economics non viables", severity: "error" },
        { check: "Concentration > 50%", result: "Normal pré-revenu mais risque", severity: "warning" },
        { check: "Note = D+", result: "Pas de C avec ces métriques", severity: "ok" },
        { check: "Confiance = Faible", result: "Données insuffisantes pour valoriser", severity: "ok" },
      ],
    },
  },
];
