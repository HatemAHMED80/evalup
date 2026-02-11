// Calculs locaux de ratios financiers - GRATUIT (pas d'appel API)
// Ces calculs sont effectués côté client/serveur sans IA

export interface DonneesFinancieres {
  ca: number
  ebitda: number
  resultatNet: number
  capitauxPropres: number
  dettes: number
  tresorerie: number
  effectif?: number
  chargesPersonnel?: number
  achats?: number
  loyer?: number
  amortissements?: number
}

export interface RatiosCalcules {
  // Ratios de rentabilité
  margeEBITDA: number // EBITDA / CA
  margeNette: number // Résultat Net / CA

  // Ratios de structure
  tauxEndettement: number // Dettes / Capitaux Propres
  autonomieFinanciere: number // Capitaux Propres / (Capitaux Propres + Dettes)

  // Ratios de productivité
  caParSalarie?: number // CA / Effectif
  ebitdaParSalarie?: number // EBITDA / Effectif

  // Ratios d'exploitation
  tauxChargesPersonnel?: number // Charges Personnel / CA
  tauxAchats?: number // Achats / CA
  tauxLoyer?: number // Loyer / CA

  // Indicateurs de valorisation
  multipleCAImplicite: number // Valorisation suggérée / CA
  multipleEBITDAImplicite: number // Valorisation suggérée / EBITDA
}

export interface InterpretationRatio {
  nom: string
  valeur: number
  unite: string
  niveau: 'excellent' | 'bon' | 'moyen' | 'faible' | 'critique'
  commentaire: string
  benchmark?: { min: number; max: number; secteur?: string }
}

/**
 * Calcule tous les ratios financiers à partir des données
 * GRATUIT - Aucun appel API
 */
export function calculerRatios(donnees: DonneesFinancieres): RatiosCalcules {
  const ratios: RatiosCalcules = {
    // Rentabilité
    margeEBITDA: donnees.ca > 0 ? (donnees.ebitda / donnees.ca) * 100 : 0,
    margeNette: donnees.ca > 0 ? (donnees.resultatNet / donnees.ca) * 100 : 0,

    // Structure financière
    tauxEndettement: donnees.capitauxPropres > 0
      ? (donnees.dettes / donnees.capitauxPropres) * 100
      : donnees.dettes > 0 ? 999 : 0,
    autonomieFinanciere: (donnees.capitauxPropres + donnees.dettes) > 0
      ? (donnees.capitauxPropres / (donnees.capitauxPropres + donnees.dettes)) * 100
      : 0,

    // Multiples implicites (pour comparaison)
    multipleCAImplicite: 0, // Sera calculé par secteur
    multipleEBITDAImplicite: 0,
  }

  // Productivité (si effectif disponible)
  if (donnees.effectif && donnees.effectif > 0) {
    ratios.caParSalarie = donnees.ca / donnees.effectif
    ratios.ebitdaParSalarie = donnees.ebitda / donnees.effectif
  }

  // Ratios d'exploitation (si données disponibles)
  if (donnees.chargesPersonnel !== undefined && donnees.ca > 0) {
    ratios.tauxChargesPersonnel = (donnees.chargesPersonnel / donnees.ca) * 100
  }
  if (donnees.achats !== undefined && donnees.ca > 0) {
    ratios.tauxAchats = (donnees.achats / donnees.ca) * 100
  }
  if (donnees.loyer !== undefined && donnees.ca > 0) {
    ratios.tauxLoyer = (donnees.loyer / donnees.ca) * 100
  }

  return ratios
}

/**
 * Benchmarks par secteur pour les ratios
 */
export const BENCHMARKS_SECTEUR: Record<string, {
  margeEBITDA: { min: number; max: number; excellent: number }
  margeNette: { min: number; max: number; excellent: number }
  tauxEndettement: { max: number; critique: number }
  tauxChargesPersonnel?: { min: number; max: number }
  tauxAchats?: { min: number; max: number }
}> = {
  restaurant: {
    margeEBITDA: { min: 5, max: 15, excellent: 20 },
    margeNette: { min: 2, max: 8, excellent: 12 },
    tauxEndettement: { max: 150, critique: 300 },
    tauxChargesPersonnel: { min: 25, max: 40 },
    tauxAchats: { min: 25, max: 35 },
  },
  commerce: {
    margeEBITDA: { min: 3, max: 10, excellent: 15 },
    margeNette: { min: 1, max: 5, excellent: 8 },
    tauxEndettement: { max: 200, critique: 400 },
    tauxAchats: { min: 50, max: 75 },
  },
  services: {
    margeEBITDA: { min: 10, max: 25, excellent: 35 },
    margeNette: { min: 5, max: 15, excellent: 25 },
    tauxEndettement: { max: 100, critique: 200 },
    tauxChargesPersonnel: { min: 40, max: 60 },
  },
  btp: {
    margeEBITDA: { min: 5, max: 12, excellent: 18 },
    margeNette: { min: 2, max: 7, excellent: 12 },
    tauxEndettement: { max: 150, critique: 300 },
    tauxChargesPersonnel: { min: 30, max: 50 },
  },
  transport: {
    margeEBITDA: { min: 8, max: 15, excellent: 20 },
    margeNette: { min: 3, max: 8, excellent: 12 },
    tauxEndettement: { max: 200, critique: 400 },
  },
  saas: {
    margeEBITDA: { min: 15, max: 40, excellent: 60 },
    margeNette: { min: 5, max: 25, excellent: 40 },
    tauxEndettement: { max: 50, critique: 150 },
    tauxChargesPersonnel: { min: 50, max: 70 },
  },
  industrie: {
    margeEBITDA: { min: 8, max: 18, excellent: 25 },
    margeNette: { min: 3, max: 10, excellent: 15 },
    tauxEndettement: { max: 150, critique: 300 },
    tauxAchats: { min: 40, max: 60 },
  },
}

/**
 * Interprète un ratio avec son benchmark sectoriel
 * GRATUIT - Aucun appel API
 */
export function interpreterRatio(
  nom: string,
  valeur: number,
  secteur: string
): InterpretationRatio {
  const benchmarks = BENCHMARKS_SECTEUR[secteur] || BENCHMARKS_SECTEUR['services']

  let niveau: InterpretationRatio['niveau'] = 'moyen'
  let commentaire = ''
  let benchmark: InterpretationRatio['benchmark'] | undefined

  switch (nom) {
    case 'margeEBITDA':
      benchmark = { min: benchmarks.margeEBITDA.min, max: benchmarks.margeEBITDA.excellent }
      if (valeur >= benchmarks.margeEBITDA.excellent) {
        niveau = 'excellent'
        commentaire = 'Rentabilité exceptionnelle pour le secteur'
      } else if (valeur >= benchmarks.margeEBITDA.max) {
        niveau = 'bon'
        commentaire = 'Bonne rentabilité, au-dessus de la moyenne'
      } else if (valeur >= benchmarks.margeEBITDA.min) {
        niveau = 'moyen'
        commentaire = 'Rentabilité dans la moyenne du secteur'
      } else if (valeur > 0) {
        niveau = 'faible'
        commentaire = 'Rentabilité sous la moyenne sectorielle'
      } else {
        niveau = 'critique'
        commentaire = 'Rentabilité négative - situation préoccupante'
      }
      return { nom: "Marge d'EBITDA", valeur, unite: '%', niveau, commentaire, benchmark }

    case 'margeNette':
      benchmark = { min: benchmarks.margeNette.min, max: benchmarks.margeNette.excellent }
      if (valeur >= benchmarks.margeNette.excellent) {
        niveau = 'excellent'
        commentaire = 'Marge nette exceptionnelle'
      } else if (valeur >= benchmarks.margeNette.max) {
        niveau = 'bon'
        commentaire = 'Bonne marge nette'
      } else if (valeur >= benchmarks.margeNette.min) {
        niveau = 'moyen'
        commentaire = 'Marge nette dans la norme'
      } else if (valeur > 0) {
        niveau = 'faible'
        commentaire = 'Marge nette insuffisante'
      } else {
        niveau = 'critique'
        commentaire = 'Entreprise déficitaire'
      }
      return { nom: 'Marge nette', valeur, unite: '%', niveau, commentaire, benchmark }

    case 'tauxEndettement':
      benchmark = { min: 0, max: benchmarks.tauxEndettement.max }
      if (valeur <= 50) {
        niveau = 'excellent'
        commentaire = 'Structure financière très solide'
      } else if (valeur <= benchmarks.tauxEndettement.max) {
        niveau = 'bon'
        commentaire = 'Endettement maîtrisé'
      } else if (valeur <= benchmarks.tauxEndettement.critique) {
        niveau = 'moyen'
        commentaire = 'Endettement à surveiller'
      } else {
        niveau = 'critique'
        commentaire = 'Surendettement - risque financier élevé'
      }
      return { nom: "Taux d'endettement", valeur, unite: '%', niveau, commentaire, benchmark }

    default:
      return { nom, valeur, unite: '%', niveau: 'moyen', commentaire: 'Non interprété' }
  }
}

/**
 * Génère un résumé textuel des ratios pour l'affichage
 * GRATUIT - Aucun appel API
 */
export function genererResumeRatios(
  ratios: RatiosCalcules,
  secteur: string
): string {
  const interpretations = [
    interpreterRatio('margeEBITDA', ratios.margeEBITDA, secteur),
    interpreterRatio('margeNette', ratios.margeNette, secteur),
    interpreterRatio('tauxEndettement', ratios.tauxEndettement, secteur),
  ]

  const lignes: string[] = [
    '## Analyse des ratios financiers\n',
  ]

  for (const interp of interpretations) {
    const emoji = {
      excellent: '🟢',
      bon: '🟡',
      moyen: '🟠',
      faible: '🔴',
      critique: '⛔',
    }[interp.niveau]

    lignes.push(`### ${interp.nom}`)
    lignes.push(`**${interp.valeur.toFixed(1)}${interp.unite}** ${emoji}`)
    lignes.push(`${interp.commentaire}`)
    if (interp.benchmark) {
      lignes.push(`_Benchmark secteur: ${interp.benchmark.min}% - ${interp.benchmark.max}%_`)
    }
    lignes.push('')
  }

  // Ratios de productivité si disponibles
  if (ratios.caParSalarie) {
    lignes.push('### Productivité')
    lignes.push(`- CA par salarié: **${formatEuro(ratios.caParSalarie)}**`)
    if (ratios.ebitdaParSalarie) {
      lignes.push(`- EBITDA par salarié: **${formatEuro(ratios.ebitdaParSalarie)}**`)
    }
    lignes.push('')
  }

  return lignes.join('\n')
}

/**
 * Formate un montant en euros
 */
function formatEuro(montant: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(montant)
}

/**
 * Calcule les multiples de valorisation suggérés par secteur
 * GRATUIT - Aucun appel API
 */
export function calculerMultiplesSuggeres(
  secteur: string,
  ratios: RatiosCalcules
): { multipleCA: { min: number; max: number }; multipleEBITDA: { min: number; max: number } } {
  // Multiples de base par secteur
  const multiplesBase: Record<string, { ca: { min: number; max: number }; ebitda: { min: number; max: number } }> = {
    restaurant: { ca: { min: 0.3, max: 0.8 }, ebitda: { min: 2.5, max: 4 } },
    commerce: { ca: { min: 0.2, max: 0.6 }, ebitda: { min: 2, max: 4 } },
    services: { ca: { min: 0.5, max: 1.2 }, ebitda: { min: 3, max: 6 } },
    btp: { ca: { min: 0.2, max: 0.5 }, ebitda: { min: 3, max: 5 } },
    transport: { ca: { min: 0.3, max: 0.7 }, ebitda: { min: 3, max: 5 } },
    saas: { ca: { min: 2, max: 8 }, ebitda: { min: 8, max: 15 } },
    industrie: { ca: { min: 0.4, max: 1 }, ebitda: { min: 4, max: 7 } },
  }

  const base = multiplesBase[secteur] || multiplesBase['services']

  // Ajustement selon la qualité des ratios
  let ajustement = 0
  const benchmarks = BENCHMARKS_SECTEUR[secteur] || BENCHMARKS_SECTEUR['services']

  // Bonus si margeEBITDA excellente
  if (ratios.margeEBITDA >= benchmarks.margeEBITDA.excellent) {
    ajustement += 0.15
  } else if (ratios.margeEBITDA >= benchmarks.margeEBITDA.max) {
    ajustement += 0.05
  } else if (ratios.margeEBITDA < benchmarks.margeEBITDA.min) {
    ajustement -= 0.1
  }

  // Malus si endettement élevé
  if (ratios.tauxEndettement > benchmarks.tauxEndettement.critique) {
    ajustement -= 0.2
  } else if (ratios.tauxEndettement > benchmarks.tauxEndettement.max) {
    ajustement -= 0.1
  }

  return {
    multipleCA: {
      min: Math.max(0.1, base.ca.min * (1 + ajustement)),
      max: base.ca.max * (1 + ajustement),
    },
    multipleEBITDA: {
      min: Math.max(1, base.ebitda.min * (1 + ajustement)),
      max: base.ebitda.max * (1 + ajustement),
    },
  }
}
