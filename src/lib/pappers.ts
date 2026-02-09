// Client API Pappers pour récupérer les informations d'entreprise
// Documentation API : https://api.pappers.fr/documentation

import { nafToSecteur } from './naf-mapping'
import { isValidSiren } from './security/validation'

// ============================================================
// TYPES POUR L'API PAPPERS
// ============================================================

// Bilan détaillé provenant de Pappers
export interface BilanPappers {
  annee: number
  date_cloture: string
  date_cloture_exercice_precedent?: string
  duree_exercice?: number

  // Compte de résultat
  chiffre_affaires?: number
  resultat_exploitation?: number
  resultat_net?: number

  // Pour calculer EBITDA
  dotations_amortissements?: number
  dotations_provisions?: number

  // Bilan actif
  immobilisations_corporelles?: number
  immobilisations_incorporelles?: number
  immobilisations_financieres?: number
  stocks?: number
  creances_clients?: number
  autres_creances?: number
  disponibilites?: number // Trésorerie
  total_actif?: number

  // Bilan passif
  capital_social?: number
  capitaux_propres?: number
  provisions_risques_charges?: number
  dettes_financieres?: number
  dettes_fournisseurs?: number
  dettes_fiscales_sociales?: number
  autres_dettes?: number
  total_passif?: number

  // Ratios
  effectif?: number
}

// Réponse complète de l'API Pappers
export interface EntreprisePappers {
  siren: string
  siret: string
  nom_entreprise: string
  nom_commercial?: string
  sigle?: string
  date_creation: string
  date_creation_formate: string
  date_cessation?: string
  entreprise_cessee: boolean
  statut_rcs?: string
  categorie_juridique?: string
  forme_juridique?: string
  effectif?: string
  effectif_min?: number
  effectif_max?: number
  tranche_effectif?: string
  annee_effectif?: number
  capital?: number
  code_naf: string
  libelle_code_naf: string
  domaine_activite?: string
  objet_social?: string
  siege: {
    siret: string
    adresse_ligne_1?: string
    adresse_ligne_2?: string
    code_postal: string
    ville: string
    pays?: string
    latitude?: number
    longitude?: number
  }
  dirigeants?: DirigeantPappers[]
  finances?: FinancesPappers[]
  bilans?: BilanPappers[]
}

export interface DirigeantPappers {
  nom?: string
  prenom?: string
  nom_complet?: string
  qualite?: string
  date_prise_de_poste?: string
  type_dirigeant?: string
}

export interface FinancesPappers {
  annee: number
  date_cloture?: string
  date_de_cloture_exercice?: string
  duree_exercice?: number
  chiffre_affaires?: number
  resultat?: number
  resultat_exploitation?: number
  effectif?: number
  tresorerie?: number
  dettes_financieres?: number
  fonds_propres?: number
  excedent_brut_exploitation?: number
  BFR?: number
  capacite_autofinancement?: number
}

// ============================================================
// TYPES NORMALISÉS POUR NOTRE APPLICATION
// ============================================================

export interface BilanNormalise {
  annee: number
  dateCloture: string
  dureeExercice: number

  // Compte de résultat
  chiffreAffaires: number
  resultatExploitation: number
  resultatNet: number
  ebitda: number
  margeNette: number // En %
  margeEbitda: number // En %

  // Bilan
  tresorerie: number
  stocks: number
  creancesClients: number
  capitauxPropres: number
  dettesFinancieres: number
  dettesFournisseurs: number
  dettesFiscalesSociales: number

  // Indicateurs calculés
  bfr: number // Besoin en Fonds de Roulement
  detteNette: number // Dettes financières - Trésorerie
  ratioEndettement: number // Dettes financières / Capitaux propres

  effectif: number | null
}

export interface DonneesEntreprisePappers {
  // Identifiants
  siren: string
  siret: string

  // Infos générales
  nom: string
  sigle: string | null
  formeJuridique: string | null
  dateCreation: string
  anciennete: number
  entrepriseCessee: boolean
  capital: number | null

  // Activité
  codeNaf: string
  libelleNaf: string
  secteurEvalup: string | null
  objetSocial: string | null

  // Localisation
  adresse: string
  codePostal: string
  ville: string
  region: string | null

  // Effectif
  effectif: number | null
  trancheEffectif: string | null

  // Dirigeants
  dirigeants: {
    nom: string
    qualite: string
    datePrisePoste: string | null
  }[]

  // Données financières (dernière année)
  chiffreAffaires: number | null
  resultatNet: number | null
  ebitda: number | null
  tresorerie: number | null
  dettesFinancieres: number | null
  capitauxPropres: number | null

  // Historique des bilans (3 dernières années)
  bilans: BilanNormalise[]

  // Évolutions calculées
  evolutionCA: number | null // % de croissance sur 3 ans
  evolutionResultat: number | null
}

// ============================================================
// GESTION DES ERREURS
// ============================================================

export class PappersError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'PappersError'
  }
}

// ============================================================
// RETRY AVEC BACKOFF EXPONENTIEL
// ============================================================

const MAX_RETRIES = 2
const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504]

async function fetchWithRetry<T>(
  url: string,
  transform: (data: EntreprisePappers) => T,
  retries = MAX_RETRIES
): Promise<T> {
  let lastError: PappersError | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url)

      if (!response.ok) {
        const errorMessages: Record<number, { message: string; code: string }> = {
          400: { message: 'Requête invalide', code: 'BAD_REQUEST' },
          401: { message: 'Clé API invalide', code: 'INVALID_API_KEY' },
          404: { message: 'Entreprise non trouvée', code: 'NOT_FOUND' },
          429: { message: 'Limite de requêtes atteinte. Réessayez plus tard.', code: 'RATE_LIMIT' },
          500: { message: 'Erreur serveur Pappers', code: 'SERVER_ERROR' },
        }

        const error = errorMessages[response.status] || {
          message: `Erreur API Pappers: ${response.status}`,
          code: 'UNKNOWN_ERROR',
        }

        lastError = new PappersError(error.message, response.status, error.code)

        // Ne retenter que pour les erreurs transitoires
        if (RETRYABLE_STATUS_CODES.includes(response.status) && attempt < retries) {
          const delay = Math.pow(2, attempt) * 500 // 500ms, 1s, 2s
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }

        throw lastError
      }

      const data: EntreprisePappers = await response.json()
      return transform(data)
    } catch (error) {
      if (error instanceof PappersError) {
        // Erreurs non-retryables (400, 401, 404) : lancer immédiatement
        if (!RETRYABLE_STATUS_CODES.includes(error.statusCode || 0)) {
          throw error
        }
        lastError = error
      } else {
        // Erreur réseau : retenter
        lastError = new PappersError(
          `Erreur de connexion à l'API Pappers: ${error}`,
          500,
          'CONNECTION_ERROR'
        )
      }

      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 500
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new PappersError('Erreur inconnue après tentatives', 500, 'UNKNOWN_ERROR')
}

// ============================================================
// FONCTIONS PRINCIPALES
// ============================================================

export function isPappersConfigured(): boolean {
  return !!process.env.PAPPERS_API_KEY
}

// Récupère les informations complètes d'une entreprise
export async function rechercherEntreprise(sirenOuSiret: string): Promise<DonneesEntreprisePappers> {
  const apiKey = process.env.PAPPERS_API_KEY

  if (!apiKey) {
    throw new PappersError(
      'Clé API Pappers non configurée. Ajoutez PAPPERS_API_KEY dans .env.local',
      500,
      'API_NOT_CONFIGURED'
    )
  }

  // Nettoyer le numéro
  const numero = sirenOuSiret.replace(/[\s-]/g, '')

  // Valider le format (SIREN 9 chiffres ou SIRET 14 chiffres)
  const isSiren = numero.length === 9
  const isSiret = numero.length === 14

  if (!isSiren && !isSiret) {
    throw new PappersError(
      'Format invalide. Entrez un SIREN (9 chiffres) ou SIRET (14 chiffres)',
      400,
      'INVALID_FORMAT'
    )
  }

  // Validation Luhn pour SIREN
  const sirenPart = isSiren ? numero : numero.substring(0, 9)
  if (!isValidSiren(sirenPart)) {
    throw new PappersError(
      'Numéro SIREN invalide (échec vérification Luhn)',
      400,
      'INVALID_SIREN'
    )
  }
  const baseUrl = 'https://api.pappers.fr/v2/entreprise'

  const params = new URLSearchParams({
    api_token: apiKey,
    [isSiren ? 'siren' : 'siret']: numero,
  })

  const url = `${baseUrl}?${params}`
  return fetchWithRetry(url, normaliserDonnees)
}

// Récupère uniquement les bilans d'une entreprise (pour rafraîchir les données)
export async function rechercherBilans(siren: string): Promise<BilanNormalise[]> {
  const apiKey = process.env.PAPPERS_API_KEY

  if (!apiKey) {
    throw new PappersError('Clé API Pappers non configurée', 500, 'API_NOT_CONFIGURED')
  }

  const baseUrl = 'https://api.pappers.fr/v2/entreprise'
  const params = new URLSearchParams({
    api_token: apiKey,
    siren: siren.replace(/[\s-]/g, ''),
  })

  const url = `${baseUrl}?${params}`
  return fetchWithRetry(url, (data) => normaliserBilans(data.finances, data.bilans))
}

// ============================================================
// FONCTIONS DE NORMALISATION
// ============================================================

function normaliserDonnees(data: EntreprisePappers): DonneesEntreprisePappers {
  // Calculer l'ancienneté
  const dateCreation = new Date(data.date_creation)
  const aujourdhui = new Date()
  const anciennete = Math.floor(
    (aujourdhui.getTime() - dateCreation.getTime()) / (1000 * 60 * 60 * 24 * 365)
  )

  // Normaliser les bilans
  const bilans = normaliserBilans(data.finances, data.bilans)

  // Extraire les données du dernier bilan
  const dernierBilan = bilans.length > 0 ? bilans[0] : null

  // Calculer l'évolution sur 3 ans
  let evolutionCA: number | null = null
  let evolutionResultat: number | null = null

  if (bilans.length >= 2) {
    const bilanRecent = bilans[0]
    const bilanAncien = bilans[bilans.length - 1]

    if (bilanAncien.chiffreAffaires > 0) {
      evolutionCA = Math.round(
        ((bilanRecent.chiffreAffaires - bilanAncien.chiffreAffaires) / bilanAncien.chiffreAffaires) * 100
      )
    }

    if (bilanAncien.resultatNet !== 0) {
      evolutionResultat = Math.round(
        ((bilanRecent.resultatNet - bilanAncien.resultatNet) / Math.abs(bilanAncien.resultatNet)) * 100
      )
    }
  }

  // Effectif
  let effectif: number | null = dernierBilan?.effectif || null
  if (!effectif && data.effectif_min && data.effectif_max) {
    effectif = Math.round((data.effectif_min + data.effectif_max) / 2)
  }

  // Adresse complète
  const adresseParts = [data.siege.adresse_ligne_1, data.siege.adresse_ligne_2].filter(Boolean)
  const adresse = adresseParts.join(', ') || `${data.siege.code_postal} ${data.siege.ville}`

  // Dirigeants
  const dirigeants = (data.dirigeants || []).map(d => ({
    nom: d.nom_complet || `${d.prenom || ''} ${d.nom || ''}`.trim(),
    qualite: d.qualite || 'Non précisé',
    datePrisePoste: d.date_prise_de_poste || null,
  }))

  return {
    siren: data.siren,
    siret: data.siret || data.siege.siret,
    nom: data.nom_commercial || data.nom_entreprise,
    sigle: data.sigle || null,
    formeJuridique: data.forme_juridique || null,
    dateCreation: data.date_creation_formate,
    anciennete: Math.max(0, anciennete),
    entrepriseCessee: data.entreprise_cessee,
    capital: data.capital || null,
    codeNaf: data.code_naf,
    libelleNaf: data.libelle_code_naf,
    secteurEvalup: nafToSecteur(data.code_naf),
    objetSocial: data.objet_social || null,
    adresse,
    codePostal: data.siege.code_postal,
    ville: data.siege.ville,
    region: mapCodePostalToRegion(data.siege.code_postal),
    effectif,
    trancheEffectif: data.tranche_effectif || null,
    dirigeants,
    chiffreAffaires: dernierBilan?.chiffreAffaires || null,
    resultatNet: dernierBilan?.resultatNet || null,
    ebitda: dernierBilan?.ebitda || null,
    tresorerie: dernierBilan?.tresorerie || null,
    dettesFinancieres: dernierBilan?.dettesFinancieres || null,
    capitauxPropres: dernierBilan?.capitauxPropres || null,
    bilans,
    evolutionCA,
    evolutionResultat,
  }
}

function normaliserBilans(
  finances?: FinancesPappers[],
  bilans?: BilanPappers[]
): BilanNormalise[] {
  const resultats: BilanNormalise[] = []

  // Utiliser les bilans détaillés si disponibles, sinon les finances simplifiées
  const source = bilans && bilans.length > 0 ? bilans : finances

  if (!source || source.length === 0) {
    return []
  }

  // Trier par année décroissante et prendre les 3 dernières années
  const sourceTrie = [...source].sort((a, b) => b.annee - a.annee).slice(0, 3)

  for (const item of sourceTrie) {
    // Déterminer si c'est un bilan détaillé (avec disponibilites) ou des finances simplifiées
    // Les bilans détaillés ont des champs spécifiques comme disponibilites, creances_clients
    const estBilanDetaille = 'disponibilites' in item || 'creances_clients' in item

    let chiffreAffaires = 0
    let resultatExploitation = 0
    let resultatNet = 0
    let dotations = 0
    let tresorerie = 0
    let stocks = 0
    let creancesClients = 0
    let capitauxPropres = 0
    let dettesFinancieres = 0
    let dettesFournisseurs = 0
    let dettesFiscalesSociales = 0
    let effectif: number | null = null
    let dureeExercice = 12

    if (estBilanDetaille) {
      const bilan = item as BilanPappers

      // Pappers renvoie les montants en centimes, diviser par 100
      const diviseur = 100

      chiffreAffaires = (bilan.chiffre_affaires || 0) / diviseur
      resultatExploitation = (bilan.resultat_exploitation || 0) / diviseur
      resultatNet = (bilan.resultat_net || 0) / diviseur
      dotations = ((bilan.dotations_amortissements || 0) + (bilan.dotations_provisions || 0)) / diviseur
      tresorerie = (bilan.disponibilites || 0) / diviseur
      stocks = (bilan.stocks || 0) / diviseur
      creancesClients = (bilan.creances_clients || 0) / diviseur
      capitauxPropres = (bilan.capitaux_propres || 0) / diviseur
      dettesFinancieres = (bilan.dettes_financieres || 0) / diviseur
      dettesFournisseurs = (bilan.dettes_fournisseurs || 0) / diviseur
      dettesFiscalesSociales = (bilan.dettes_fiscales_sociales || 0) / diviseur
      effectif = bilan.effectif || null
      dureeExercice = bilan.duree_exercice || 12
    } else {
      const finance = item as FinancesPappers
      chiffreAffaires = finance.chiffre_affaires || 0
      resultatNet = finance.resultat || 0
      resultatExploitation = finance.resultat_exploitation || 0
      effectif = finance.effectif || null
      tresorerie = finance.tresorerie || 0
      dettesFinancieres = finance.dettes_financieres || 0
      capitauxPropres = finance.fonds_propres || 0
      dureeExercice = finance.duree_exercice || 12
      // Pour l'EBITDA, utiliser l'EBE si disponible
      if (finance.excedent_brut_exploitation) {
        dotations = finance.excedent_brut_exploitation - resultatExploitation
      }
    }

    // Calculer l'EBITDA
    const ebitda = resultatExploitation + dotations

    // Calculer les marges
    const margeNette = chiffreAffaires > 0 ? (resultatNet / chiffreAffaires) * 100 : 0
    const margeEbitda = chiffreAffaires > 0 ? (ebitda / chiffreAffaires) * 100 : 0

    // Calculer le BFR - utiliser la valeur Pappers si disponible (pour finances), sinon calculer
    let bfr: number
    const financeData = item as FinancesPappers
    if (!estBilanDetaille && financeData.BFR !== undefined) {
      bfr = financeData.BFR
    } else {
      bfr = stocks + creancesClients - dettesFournisseurs
    }

    // Calculer la dette nette
    const detteNette = dettesFinancieres - tresorerie

    // Calculer le ratio d'endettement
    const ratioEndettement = capitauxPropres > 0 ? dettesFinancieres / capitauxPropres : 0

    // Récupérer la date de clôture (différent selon le type de données)
    const dateCloture = item.date_cloture || (item as FinancesPappers).date_de_cloture_exercice || `${item.annee}-12-31`

    resultats.push({
      annee: item.annee,
      dateCloture,
      dureeExercice,
      chiffreAffaires: Math.round(chiffreAffaires),
      resultatExploitation: Math.round(resultatExploitation),
      resultatNet: Math.round(resultatNet),
      ebitda: Math.round(ebitda),
      margeNette: Math.round(margeNette * 10) / 10,
      margeEbitda: Math.round(margeEbitda * 10) / 10,
      tresorerie: Math.round(tresorerie),
      stocks: Math.round(stocks),
      creancesClients: Math.round(creancesClients),
      capitauxPropres: Math.round(capitauxPropres),
      dettesFinancieres: Math.round(dettesFinancieres),
      dettesFournisseurs: Math.round(dettesFournisseurs),
      dettesFiscalesSociales: Math.round(dettesFiscalesSociales),
      bfr: Math.round(bfr),
      detteNette: Math.round(detteNette),
      ratioEndettement: Math.round(ratioEndettement * 100) / 100,
      effectif,
    })
  }

  return resultats
}

// ============================================================
// UTILITAIRES
// ============================================================

function mapCodePostalToRegion(codePostal: string): string | null {
  const departement = codePostal.substring(0, 2)

  const regionsMap: Record<string, string> = {
    // Île-de-France
    '75': 'Île-de-France', '77': 'Île-de-France', '78': 'Île-de-France',
    '91': 'Île-de-France', '92': 'Île-de-France', '93': 'Île-de-France',
    '94': 'Île-de-France', '95': 'Île-de-France',
    // Auvergne-Rhône-Alpes
    '01': 'Auvergne-Rhône-Alpes', '03': 'Auvergne-Rhône-Alpes', '07': 'Auvergne-Rhône-Alpes',
    '15': 'Auvergne-Rhône-Alpes', '26': 'Auvergne-Rhône-Alpes', '38': 'Auvergne-Rhône-Alpes',
    '42': 'Auvergne-Rhône-Alpes', '43': 'Auvergne-Rhône-Alpes', '63': 'Auvergne-Rhône-Alpes',
    '69': 'Auvergne-Rhône-Alpes', '73': 'Auvergne-Rhône-Alpes', '74': 'Auvergne-Rhône-Alpes',
    // Nouvelle-Aquitaine
    '16': 'Nouvelle-Aquitaine', '17': 'Nouvelle-Aquitaine', '19': 'Nouvelle-Aquitaine',
    '23': 'Nouvelle-Aquitaine', '24': 'Nouvelle-Aquitaine', '33': 'Nouvelle-Aquitaine',
    '40': 'Nouvelle-Aquitaine', '47': 'Nouvelle-Aquitaine', '64': 'Nouvelle-Aquitaine',
    '79': 'Nouvelle-Aquitaine', '86': 'Nouvelle-Aquitaine', '87': 'Nouvelle-Aquitaine',
    // Occitanie
    '09': 'Occitanie', '11': 'Occitanie', '12': 'Occitanie', '30': 'Occitanie',
    '31': 'Occitanie', '32': 'Occitanie', '34': 'Occitanie', '46': 'Occitanie',
    '48': 'Occitanie', '65': 'Occitanie', '66': 'Occitanie', '81': 'Occitanie', '82': 'Occitanie',
    // Hauts-de-France
    '02': 'Hauts-de-France', '59': 'Hauts-de-France', '60': 'Hauts-de-France',
    '62': 'Hauts-de-France', '80': 'Hauts-de-France',
    // Provence-Alpes-Côte d'Azur
    '04': "Provence-Alpes-Côte d'Azur", '05': "Provence-Alpes-Côte d'Azur",
    '06': "Provence-Alpes-Côte d'Azur", '13': "Provence-Alpes-Côte d'Azur",
    '83': "Provence-Alpes-Côte d'Azur", '84': "Provence-Alpes-Côte d'Azur",
    // Grand Est
    '08': 'Grand Est', '10': 'Grand Est', '51': 'Grand Est', '52': 'Grand Est',
    '54': 'Grand Est', '55': 'Grand Est', '57': 'Grand Est', '67': 'Grand Est',
    '68': 'Grand Est', '88': 'Grand Est',
    // Pays de la Loire
    '44': 'Pays de la Loire', '49': 'Pays de la Loire', '53': 'Pays de la Loire',
    '72': 'Pays de la Loire', '85': 'Pays de la Loire',
    // Bretagne
    '22': 'Bretagne', '29': 'Bretagne', '35': 'Bretagne', '56': 'Bretagne',
    // Normandie
    '14': 'Normandie', '27': 'Normandie', '50': 'Normandie', '61': 'Normandie', '76': 'Normandie',
    // Bourgogne-Franche-Comté
    '21': 'Bourgogne-Franche-Comté', '25': 'Bourgogne-Franche-Comté', '39': 'Bourgogne-Franche-Comté',
    '58': 'Bourgogne-Franche-Comté', '70': 'Bourgogne-Franche-Comté', '71': 'Bourgogne-Franche-Comté',
    '89': 'Bourgogne-Franche-Comté', '90': 'Bourgogne-Franche-Comté',
    // Centre-Val de Loire
    '18': 'Centre-Val de Loire', '28': 'Centre-Val de Loire', '36': 'Centre-Val de Loire',
    '37': 'Centre-Val de Loire', '41': 'Centre-Val de Loire', '45': 'Centre-Val de Loire',
    // Corse
    '20': 'Corse', '2A': 'Corse', '2B': 'Corse',
    // DOM-TOM
    '97': 'DOM-TOM', '98': 'DOM-TOM',
  }

  return regionsMap[departement] || null
}
