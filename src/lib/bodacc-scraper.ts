// Scraper BODACC pour récupérer les cessions de fonds de commerce
// Utilise l'API Open Data BODACC officielle

import { Transaction } from './transactions'
import { nafToSecteur } from './naf-mapping'

// Configuration du scraper - API Open Data BODACC officielle
const BODACC_API_URL = 'https://bodacc-datadila.opendatasoft.com/api/records/1.0/search'
const DELAY_BETWEEN_REQUESTS = 500 // 0.5 seconde entre chaque requête

// Type pour les résultats de l'API BODACC
interface BodaccRecord {
  recordid: string
  fields: {
    id: string
    dateparution: string
    typeavis: string
    typeavis_lib: string
    familleavis: string
    familleavis_lib: string
    numerodepartement: string
    departement_nom_officiel?: string
    region_nom_officiel?: string
    tribunal: string
    registre?: string
    commercant?: string
    ville?: string
    cp?: string
    activite?: string
    listepersonnes?: string
    listeetablissements?: string
    listeprecedentproprietaire?: string
    jugement?: string
    acte?: string
    url_complete?: string
  }
}

interface BodaccApiResponse {
  nhits: number
  records: BodaccRecord[]
}

// Type pour les résultats bruts du scraping
interface AnnonceBrute {
  id: string
  date: string
  type: string
  contenu: string
  registre?: string
  tribunal?: string
  region?: string
  codePostal?: string
}

// Résultat du scraping
export interface ScrapingResult {
  success: boolean
  transactionsAjoutees: number
  transactionsIgnorees: number
  erreurs: string[]
  duree: number
}

// Délai entre les requêtes
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Génère un ID unique pour une transaction
function genererIdTransaction(annonce: AnnonceBrute): string {
  return `bodacc-${annonce.id}-${annonce.date.replace(/[^0-9]/g, '')}`
}

// Extrait le prix de cession d'un texte
function extrairePrix(texte: string): number | null {
  // Patterns pour trouver le prix
  const patterns = [
    /prix\s*(?:de\s*(?:cession|vente))?\s*[:\s]*(\d[\d\s]*(?:[.,]\d+)?)\s*(?:€|euros?)/i,
    /(\d[\d\s]*(?:[.,]\d+)?)\s*(?:€|euros?)\s*(?:prix|montant)/i,
    /cession\s*[:\s]*(\d[\d\s]*(?:[.,]\d+)?)\s*(?:€|euros?)/i,
    /(\d[\d\s]*)\s*(?:€|euros?)/gi,
  ]

  for (const pattern of patterns) {
    const match = texte.match(pattern)
    if (match && match[1]) {
      // Nettoyer et convertir
      const prixStr = match[1].replace(/\s/g, '').replace(',', '.')
      const prix = parseFloat(prixStr)
      if (!isNaN(prix) && prix > 1000) { // Ignorer les prix trop bas
        return prix
      }
    }
  }

  return null
}

// Extrait le CA d'un texte
function extraireCA(texte: string): number | null {
  const patterns = [
    /chiffre\s*(?:d['']affaires?)\s*[:\s]*(\d[\d\s]*(?:[.,]\d+)?)\s*(?:€|euros?)/i,
    /CA\s*[:\s]*(\d[\d\s]*(?:[.,]\d+)?)\s*(?:€|euros?)/i,
  ]

  for (const pattern of patterns) {
    const match = texte.match(pattern)
    if (match && match[1]) {
      const caStr = match[1].replace(/\s/g, '').replace(',', '.')
      const ca = parseFloat(caStr)
      if (!isNaN(ca) && ca > 0) {
        return ca
      }
    }
  }

  return null
}

// Extrait le secteur d'activité d'un texte
function extraireSecteur(texte: string): { code: string; brut: string } | null {
  // Mots-clés pour détecter le secteur
  const secteurKeywords: Record<string, string[]> = {
    'restauration': ['restaurant', 'restauration', 'brasserie', 'café', 'bar', 'pizzeria', 'traiteur', 'snack', 'fast-food'],
    'commerce-detail': ['commerce', 'boutique', 'magasin', 'vente au détail', 'épicerie', 'boulangerie', 'boucherie', 'fleuriste'],
    'services-b2b': ['services', 'prestation', 'conseil', 'agence', 'bureau'],
    'sante': ['pharmacie', 'médical', 'santé', 'dentaire', 'optique', 'laboratoire'],
    'construction-btp': ['bâtiment', 'construction', 'travaux', 'maçonnerie', 'plomberie', 'électricité', 'rénovation'],
    'immobilier': ['immobilier', 'agence immobilière', 'location', 'gestion immobilière'],
    'transport-logistique': ['transport', 'logistique', 'livraison', 'taxi', 'vtc', 'déménagement'],
    'industrie': ['fabrication', 'usine', 'industriel', 'production', 'manufacture'],
    'tech-saas': ['informatique', 'logiciel', 'digital', 'numérique', 'web', 'développement'],
    'ecommerce': ['e-commerce', 'vente en ligne', 'marketplace'],
    'education-formation': ['formation', 'école', 'enseignement', 'cours', 'auto-école'],
    'consulting': ['consulting', 'consultant', 'expertise', 'audit'],
  }

  const texteLower = texte.toLowerCase()

  for (const [secteurCode, keywords] of Object.entries(secteurKeywords)) {
    for (const keyword of keywords) {
      if (texteLower.includes(keyword)) {
        return { code: secteurCode, brut: keyword }
      }
    }
  }

  // Chercher un code NAF dans le texte
  const nafMatch = texte.match(/\b(\d{2}\.\d{2}[A-Z]?)\b/)
  if (nafMatch) {
    const secteurCode = nafToSecteur(nafMatch[1])
    if (secteurCode) {
      return { code: secteurCode, brut: nafMatch[1] }
    }
  }

  return null
}

// Extrait la localisation d'un texte
function extraireLocalisation(texte: string): { codePostal?: string; ville?: string; region?: string } {
  // Chercher un code postal
  const cpMatch = texte.match(/\b(\d{5})\b/)
  const codePostal = cpMatch ? cpMatch[1] : undefined

  // Mapping département → région
  const regionMap: Record<string, string> = {
    '75': 'Île-de-France', '77': 'Île-de-France', '78': 'Île-de-France',
    '91': 'Île-de-France', '92': 'Île-de-France', '93': 'Île-de-France',
    '94': 'Île-de-France', '95': 'Île-de-France',
    '69': 'Auvergne-Rhône-Alpes', '38': 'Auvergne-Rhône-Alpes', '73': 'Auvergne-Rhône-Alpes',
    '74': 'Auvergne-Rhône-Alpes', '01': 'Auvergne-Rhône-Alpes', '42': 'Auvergne-Rhône-Alpes',
    '33': 'Nouvelle-Aquitaine', '64': 'Nouvelle-Aquitaine', '40': 'Nouvelle-Aquitaine',
    '31': 'Occitanie', '34': 'Occitanie', '30': 'Occitanie', '66': 'Occitanie',
    '59': 'Hauts-de-France', '62': 'Hauts-de-France', '80': 'Hauts-de-France',
    '13': "Provence-Alpes-Côte d'Azur", '06': "Provence-Alpes-Côte d'Azur", '83': "Provence-Alpes-Côte d'Azur",
    '67': 'Grand Est', '68': 'Grand Est', '57': 'Grand Est', '54': 'Grand Est',
    '44': 'Pays de la Loire', '49': 'Pays de la Loire', '72': 'Pays de la Loire',
    '35': 'Bretagne', '29': 'Bretagne', '56': 'Bretagne', '22': 'Bretagne',
    '76': 'Normandie', '14': 'Normandie', '50': 'Normandie',
  }

  let region: string | undefined
  if (codePostal) {
    const dept = codePostal.substring(0, 2)
    region = regionMap[dept]
  }

  return { codePostal, region }
}

// Parse une annonce brute en transaction
function parseAnnonce(annonce: AnnonceBrute): Transaction | null {
  const prix = extrairePrix(annonce.contenu)

  // Ignorer si pas de prix (on garde quand même les annonces BODACC car elles ont des infos utiles)
  // On utilisera le secteur pour les statistiques même sans prix

  const secteur = extraireSecteur(annonce.contenu)

  // Ignorer si secteur non identifié
  if (!secteur) {
    return null
  }

  // Utiliser la localisation de l'API si disponible, sinon extraire du contenu
  const localisationExtraite = extraireLocalisation(annonce.contenu)
  const ca = extraireCA(annonce.contenu)

  // Priorité aux données de l'API, puis extraction du texte
  const region = annonce.region || localisationExtraite.region
  const codePostal = annonce.codePostal || localisationExtraite.codePostal

  return {
    id: genererIdTransaction(annonce),
    date: annonce.date,
    secteur: secteur.code,
    secteurBrut: secteur.brut,
    prix: prix || 0, // On garde même si pas de prix pour les stats sectorielles
    chiffreAffaires: ca ?? undefined,
    localisation: region,
    codePostal: codePostal,
    source: 'bodacc',
    description: annonce.contenu.substring(0, 500),
    multipleCA: ca && prix ? Math.round((prix / ca) * 100) / 100 : undefined,
  }
}

// Récupère les annonces depuis l'API BODACC Open Data
async function fetchBodaccApi(offset: number = 0, rows: number = 100): Promise<BodaccApiResponse> {
  // On cherche les avis de vente/cession de fonds de commerce
  const params = new URLSearchParams({
    dataset: 'annonces-commerciales',
    rows: rows.toString(),
    start: offset.toString(),
    sort: '-dateparution',
  })

  // Ajouter le filtre pour les ventes/cessions
  params.append('refine.familleavis', 'vente')

  const url = `${BODACC_API_URL}?${params}`
  const response = await fetch(url)

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Erreur API BODACC: ${response.status} - ${text.substring(0, 200)}`)
  }

  return response.json()
}

// Parse le champ acte JSON pour extraire des infos
function parseActe(acteStr: string | undefined): { categorieVente?: string; descriptif?: string } {
  if (!acteStr) return {}
  try {
    const acte = JSON.parse(acteStr)
    return {
      categorieVente: acte.vente?.categorieVente,
      descriptif: acte.descriptif,
    }
  } catch {
    return {}
  }
}

// Parse les établissements pour extraire l'activité
function parseEtablissements(etabStr: string | undefined): string | null {
  if (!etabStr) return null
  try {
    const etabs = JSON.parse(etabStr)
    return etabs.etablissement?.activite || null
  } catch {
    return null
  }
}

// Convertit un record BODACC en annonce brute
function recordToAnnonce(record: BodaccRecord): AnnonceBrute {
  const fields = record.fields
  const acteInfo = parseActe(fields.acte)
  const activiteEtab = parseEtablissements(fields.listeetablissements)

  // Construire le contenu à partir des champs disponibles
  const contenus: string[] = []

  if (fields.commercant) contenus.push(fields.commercant)
  if (fields.activite) contenus.push(fields.activite)
  if (activiteEtab) contenus.push(activiteEtab)
  if (acteInfo.categorieVente) contenus.push(acteInfo.categorieVente)
  if (acteInfo.descriptif) contenus.push(acteInfo.descriptif)
  if (fields.ville) contenus.push(fields.ville)

  return {
    id: fields.id || record.recordid,
    date: fields.dateparution,
    type: fields.typeavis_lib || fields.familleavis_lib || 'cession',
    contenu: contenus.join(' ').trim() || 'Annonce BODACC',
    registre: fields.registre,
    tribunal: fields.tribunal,
    region: fields.region_nom_officiel,
    codePostal: fields.cp || (fields.numerodepartement ? `${fields.numerodepartement}000` : undefined),
  }
}

// Scrape les annonces BODACC via l'API Open Data officielle
export async function scraperBodacc(nombrePages: number = 5): Promise<ScrapingResult> {
  const startTime = Date.now()
  const erreurs: string[] = []
  const transactions: Transaction[] = []
  const annonces: AnnonceBrute[] = []

  const rowsPerPage = 100

  try {
    // Récupérer plusieurs pages de résultats
    for (let page = 0; page < nombrePages; page++) {
      const offset = page * rowsPerPage

      try {
        const response = await fetchBodaccApi(offset, rowsPerPage)

        console.log(`Page ${page + 1}: ${response.records.length} annonces récupérées (total: ${response.nhits})`)

        // Convertir les records en annonces
        for (const record of response.records) {
          const annonce = recordToAnnonce(record)
          annonces.push(annonce)
        }

        // Si on a récupéré moins que demandé, on a atteint la fin
        if (response.records.length < rowsPerPage) {
          break
        }

        // Délai entre les requêtes pour respecter l'API
        if (page < nombrePages - 1) {
          await delay(DELAY_BETWEEN_REQUESTS)
        }
      } catch (e) {
        erreurs.push(`Erreur page ${page + 1}: ${e}`)
      }
    }

    // Parser les annonces
    for (const annonce of annonces) {
      try {
        const transaction = parseAnnonce(annonce)
        if (transaction) {
          transactions.push(transaction)
        }
      } catch (e) {
        erreurs.push(`Erreur parsing annonce ${annonce.id}: ${e}`)
      }
    }
  } catch (e) {
    erreurs.push(`Erreur globale: ${e}`)
  }

  const duree = Date.now() - startTime

  return {
    success: erreurs.length === 0 || transactions.length > 0,
    transactionsAjoutees: transactions.length,
    transactionsIgnorees: annonces.length - transactions.length,
    erreurs,
    duree,
  }
}

// Exécute le scraping complet et sauvegarde les transactions
export async function executerScrapingComplet(nombrePages: number = 10): Promise<ScrapingResult> {
  const startTime = Date.now()
  const erreurs: string[] = []
  const transactions: Transaction[] = []
  const annonces: AnnonceBrute[] = []

  const rowsPerPage = 100

  try {
    console.log(`Démarrage du scraping BODACC: ${nombrePages} pages de ${rowsPerPage} annonces...`)

    // Récupérer plusieurs pages de résultats
    for (let page = 0; page < nombrePages; page++) {
      const offset = page * rowsPerPage

      try {
        const response = await fetchBodaccApi(offset, rowsPerPage)

        console.log(`Page ${page + 1}/${nombrePages}: ${response.records.length} annonces (total disponible: ${response.nhits})`)

        // Convertir les records en annonces
        for (const record of response.records) {
          const annonce = recordToAnnonce(record)
          annonces.push(annonce)
        }

        // Si on a récupéré moins que demandé, on a atteint la fin
        if (response.records.length < rowsPerPage) {
          console.log('Fin des résultats atteinte.')
          break
        }

        // Délai entre les requêtes pour respecter l'API
        if (page < nombrePages - 1) {
          await delay(DELAY_BETWEEN_REQUESTS)
        }
      } catch (e) {
        erreurs.push(`Erreur page ${page + 1}: ${e}`)
        console.error(`Erreur page ${page + 1}:`, e)
      }
    }

    console.log(`${annonces.length} annonces récupérées, analyse en cours...`)

    // Parser les annonces
    for (const annonce of annonces) {
      try {
        const transaction = parseAnnonce(annonce)
        if (transaction) {
          transactions.push(transaction)
        }
      } catch (e) {
        erreurs.push(`Erreur parsing annonce ${annonce.id}: ${e}`)
      }
    }

    console.log(`${transactions.length} transactions valides trouvées`)

    // Importer la fonction d'ajout et sauvegarder
    const { ajouterTransactions } = await import('./transactions')
    const nbAjoutees = await ajouterTransactions(transactions)

    console.log(`${nbAjoutees} nouvelles transactions ajoutées`)
  } catch (e) {
    erreurs.push(`Erreur globale: ${e}`)
    console.error('Erreur globale:', e)
  }

  const duree = Date.now() - startTime

  return {
    success: erreurs.length === 0 || transactions.length > 0,
    transactionsAjoutees: transactions.length,
    transactionsIgnorees: annonces.length - transactions.length,
    erreurs,
    duree,
  }
}
