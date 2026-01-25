// Gestion des transactions de cession (stockage JSON local)

import { promises as fs } from 'fs'
import path from 'path'

// Type pour une transaction de cession
export interface Transaction {
  id: string
  date: string                    // Date de publication BODACC
  dateAcquisition?: string        // Date réelle de la cession
  secteur: string                 // Code secteur EvalUp
  secteurBrut?: string            // Secteur original du BODACC
  prix: number                    // Prix de cession en euros
  chiffreAffaires?: number        // CA si disponible
  localisation?: string           // Région
  ville?: string
  codePostal?: string
  source: 'bodacc' | 'manuel'     // Source de la donnée
  description?: string            // Description de l'activité
  multipleCA?: number             // Multiple CA calculé (prix/CA)
}

// Statistiques par secteur
export interface StatistiquesSecteur {
  secteur: string
  nombreTransactions: number
  prixMoyen: number
  prixMedian: number
  multipleCAMoyen?: number
  multipleCAMedian?: number
  derniereMiseAJour: string
}

// Chemin du fichier de transactions
const TRANSACTIONS_FILE = path.join(process.cwd(), 'src/data/transactions.json')

// Structure du fichier JSON
interface TransactionsData {
  transactions: Transaction[]
  derniereMAJ: string
  version: string
}

// Charge les transactions depuis le fichier JSON
export async function chargerTransactions(): Promise<Transaction[]> {
  try {
    const contenu = await fs.readFile(TRANSACTIONS_FILE, 'utf-8')
    const data: TransactionsData = JSON.parse(contenu)
    return data.transactions || []
  } catch {
    // Si le fichier n'existe pas, retourner un tableau vide
    return []
  }
}

// Sauvegarde les transactions dans le fichier JSON
export async function sauvegarderTransactions(transactions: Transaction[]): Promise<void> {
  const data: TransactionsData = {
    transactions,
    derniereMAJ: new Date().toISOString(),
    version: '1.0',
  }

  // S'assurer que le dossier existe
  const dir = path.dirname(TRANSACTIONS_FILE)
  await fs.mkdir(dir, { recursive: true })

  await fs.writeFile(TRANSACTIONS_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

// Ajoute de nouvelles transactions (évite les doublons par ID)
export async function ajouterTransactions(nouvelles: Transaction[]): Promise<number> {
  const existantes = await chargerTransactions()
  const idsExistants = new Set(existantes.map(t => t.id))

  const aAjouter = nouvelles.filter(t => !idsExistants.has(t.id))

  if (aAjouter.length > 0) {
    await sauvegarderTransactions([...existantes, ...aAjouter])
  }

  return aAjouter.length
}

// Récupère les transactions par secteur
export async function getTransactionsParSecteur(secteur: string): Promise<Transaction[]> {
  const transactions = await chargerTransactions()
  return transactions.filter(t => t.secteur === secteur)
}

// Calcule les statistiques par secteur
export async function calculerStatistiquesSecteur(secteur: string): Promise<StatistiquesSecteur | null> {
  const transactions = await getTransactionsParSecteur(secteur)

  if (transactions.length === 0) {
    return null
  }

  // Trier les prix pour calculer la médiane
  const prixTries = transactions.map(t => t.prix).sort((a, b) => a - b)
  const prixMoyen = prixTries.reduce((a, b) => a + b, 0) / prixTries.length
  const prixMedian = prixTries.length % 2 === 0
    ? (prixTries[prixTries.length / 2 - 1] + prixTries[prixTries.length / 2]) / 2
    : prixTries[Math.floor(prixTries.length / 2)]

  // Calculer les multiples CA si disponibles
  const transactionsAvecCA = transactions.filter(t => t.chiffreAffaires && t.chiffreAffaires > 0)
  let multipleCAMoyen: number | undefined
  let multipleCAMedian: number | undefined

  if (transactionsAvecCA.length > 0) {
    const multiples = transactionsAvecCA
      .map(t => t.prix / t.chiffreAffaires!)
      .sort((a, b) => a - b)

    multipleCAMoyen = multiples.reduce((a, b) => a + b, 0) / multiples.length

    multipleCAMedian = multiples.length % 2 === 0
      ? (multiples[multiples.length / 2 - 1] + multiples[multiples.length / 2]) / 2
      : multiples[Math.floor(multiples.length / 2)]
  }

  return {
    secteur,
    nombreTransactions: transactions.length,
    prixMoyen: Math.round(prixMoyen),
    prixMedian: Math.round(prixMedian),
    multipleCAMoyen: multipleCAMoyen ? Math.round(multipleCAMoyen * 100) / 100 : undefined,
    multipleCAMedian: multipleCAMedian ? Math.round(multipleCAMedian * 100) / 100 : undefined,
    derniereMiseAJour: new Date().toISOString(),
  }
}

// Récupère les statistiques de tous les secteurs
export async function getStatistiquesTousSecteurs(): Promise<StatistiquesSecteur[]> {
  const transactions = await chargerTransactions()

  // Grouper par secteur
  const parSecteur = transactions.reduce((acc, t) => {
    if (!acc[t.secteur]) {
      acc[t.secteur] = []
    }
    acc[t.secteur].push(t)
    return acc
  }, {} as Record<string, Transaction[]>)

  // Calculer les stats pour chaque secteur
  const stats: StatistiquesSecteur[] = []

  for (const [secteur, trans] of Object.entries(parSecteur)) {
    const prixTries = trans.map(t => t.prix).sort((a, b) => a - b)
    const prixMoyen = prixTries.reduce((a, b) => a + b, 0) / prixTries.length
    const prixMedian = prixTries.length % 2 === 0
      ? (prixTries[prixTries.length / 2 - 1] + prixTries[prixTries.length / 2]) / 2
      : prixTries[Math.floor(prixTries.length / 2)]

    const transactionsAvecCA = trans.filter(t => t.chiffreAffaires && t.chiffreAffaires > 0)
    let multipleCAMoyen: number | undefined
    let multipleCAMedian: number | undefined

    if (transactionsAvecCA.length >= 3) {
      const multiples = transactionsAvecCA
        .map(t => t.prix / t.chiffreAffaires!)
        .sort((a, b) => a - b)

      multipleCAMoyen = multiples.reduce((a, b) => a + b, 0) / multiples.length
      multipleCAMedian = multiples.length % 2 === 0
        ? (multiples[multiples.length / 2 - 1] + multiples[multiples.length / 2]) / 2
        : multiples[Math.floor(multiples.length / 2)]
    }

    stats.push({
      secteur,
      nombreTransactions: trans.length,
      prixMoyen: Math.round(prixMoyen),
      prixMedian: Math.round(prixMedian),
      multipleCAMoyen: multipleCAMoyen ? Math.round(multipleCAMoyen * 100) / 100 : undefined,
      multipleCAMedian: multipleCAMedian ? Math.round(multipleCAMedian * 100) / 100 : undefined,
      derniereMiseAJour: new Date().toISOString(),
    })
  }

  return stats
}
