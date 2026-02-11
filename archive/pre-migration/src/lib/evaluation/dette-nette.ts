// Module de calcul de la Dette Financière Nette (DFN)
// DFN = Dettes Financières - Trésorerie
// Positive = plus de dettes que de tréso → à déduire du prix
// Négative = plus de tréso que de dettes → à ajouter au prix

import { BilanAnnuel, DonneesRetraitements, DetteFinanciereNette, DetailDette } from './types'

// ============================================
// CALCUL DETTE FINANCIÈRE NETTE
// ============================================

/**
 * Calcule la dette financière nette à partir du bilan et des données collectées
 *
 * La DFN inclut :
 * - (+) Emprunts bancaires (long et court terme)
 * - (+) Découverts bancaires
 * - (+) Compte courant associés à rembourser
 * - (+) Crédit-bail restant (engagement hors bilan)
 * - (+) Participation salariés due
 * - (+) IFC non provisionnées (engagements retraite)
 * - (+) Autres dettes financières
 * - (-) Disponibilités (trésorerie)
 * - (-) VMP (placements court terme)
 */
export function calculerDetteNette(
  bilan: BilanAnnuel,
  retraitements: DonneesRetraitements
): DetteFinanciereNette {
  const detail: DetailDette[] = []

  // ============================================
  // DETTES FINANCIÈRES
  // ============================================

  // Emprunts établissements de crédit (long terme)
  const empruntsLongTerme = bilan.empruntsEtablissementsCredit ?? 0
  if (empruntsLongTerme > 0) {
    detail.push({
      libelle: 'Emprunts bancaires',
      montant: empruntsLongTerme,
      type: 'dette',
    })
  }

  // Emprunts obligataires
  const empruntsObligataires = bilan.empruntsObligataires ?? 0
  if (empruntsObligataires > 0) {
    detail.push({
      libelle: 'Emprunts obligataires',
      montant: empruntsObligataires,
      type: 'dette',
    })
  }

  // Découverts bancaires (généralement inclus dans disponibilités si négatif)
  // Pour l'instant on le met à 0, sera géré via disponibilités négatives
  const decouvertsBancaires = 0

  // Compte courant associés à rembourser
  // Note: On distingue le compte courant "à rembourser" du compte courant "capitalisable"
  // Seul le compte courant à rembourser est une dette
  const ccaARembourser = retraitements.compteCourantARembourser ?? 0
  if (ccaARembourser > 0) {
    detail.push({
      libelle: 'Compte courant associés (à rembourser)',
      montant: ccaARembourser,
      type: 'dette',
    })
  }

  // Crédit-bail restant (engagement hors bilan)
  const creditBailRestant = retraitements.creditBailRestant ?? bilan.creditBailRestant ?? 0
  if (creditBailRestant > 0) {
    detail.push({
      libelle: 'Crédit-bail restant',
      montant: creditBailRestant,
      type: 'dette',
    })
  }

  // Participation salariés due
  const participationDue = retraitements.participationDue ?? 0
  if (participationDue > 0) {
    detail.push({
      libelle: 'Participation salariés due',
      montant: participationDue,
      type: 'dette',
    })
  }

  // IFC non provisionnées (Indemnités Fin de Carrière)
  const ifcNonProvisionnees = retraitements.ifcNonProvisionnees ?? 0
  if (ifcNonProvisionnees > 0) {
    detail.push({
      libelle: 'Indemnités fin de carrière non provisionnées',
      montant: ifcNonProvisionnees,
      type: 'dette',
    })
  }

  // Dettes financières agrégées (si détail non disponible)
  // On l'utilise uniquement si les détails ne sont pas fournis
  let autresDettesFinancieres = 0
  if (bilan.dettesFinancieres && !bilan.empruntsEtablissementsCredit) {
    autresDettesFinancieres = bilan.dettesFinancieres
    if (autresDettesFinancieres > 0) {
      detail.push({
        libelle: 'Autres dettes financières',
        montant: autresDettesFinancieres,
        type: 'dette',
      })
    }
  }

  // Total dettes
  const totalDettes =
    empruntsLongTerme +
    empruntsObligataires +
    decouvertsBancaires +
    ccaARembourser +
    creditBailRestant +
    participationDue +
    ifcNonProvisionnees +
    autresDettesFinancieres

  // ============================================
  // TRÉSORERIE
  // ============================================

  // Disponibilités
  const disponibilites = Math.max(0, bilan.disponibilites ?? 0) // Si négatif, c'est un découvert
  if (disponibilites > 0) {
    detail.push({
      libelle: 'Disponibilités',
      montant: disponibilites,
      type: 'tresorerie',
    })
  }

  // VMP (Valeurs Mobilières de Placement)
  const vmp = bilan.vmp ?? 0
  if (vmp > 0) {
    detail.push({
      libelle: 'Valeurs mobilières de placement',
      montant: vmp,
      type: 'tresorerie',
    })
  }

  // Total trésorerie
  const totalTresorerie = disponibilites + vmp

  // ============================================
  // DETTE FINANCIÈRE NETTE
  // ============================================

  // DFN = Total Dettes - Total Trésorerie
  // Positive = l'entreprise a plus de dettes que de tréso → on déduit du prix de cession
  // Négative = l'entreprise a plus de tréso que de dettes → on ajoute au prix de cession
  const detteFinanciereNette = totalDettes - totalTresorerie

  return {
    empruntsLongTerme,
    empruntsCourtTerme: empruntsObligataires, // Simplifié
    decouvertsBancaires,
    compteCourantAssociesARembourser: ccaARembourser,
    creditBailRestant,
    participationDue,
    ifcNonProvisionnees,
    autresDettesFinancieres,
    totalDettes,
    disponibilites,
    vmp,
    totalTresorerie,
    detteFinanciereNette,
    detail,
  }
}

/**
 * Génère une explication de la dette nette
 */
export function genererExplicationDetteNette(dette: DetteFinanciereNette): string {
  const lignes: string[] = []

  lignes.push('**Calcul de la Dette Financière Nette (DFN)**')
  lignes.push('')

  // Dettes
  lignes.push('*Dettes financières :*')
  const dettes = dette.detail.filter((d) => d.type === 'dette')
  if (dettes.length === 0) {
    lignes.push('  Aucune dette financière')
  } else {
    for (const d of dettes) {
      lignes.push(`  + ${d.libelle} : ${formatK(d.montant)}`)
    }
  }
  lignes.push(`  **Total dettes** : ${formatK(dette.totalDettes)}`)
  lignes.push('')

  // Trésorerie
  lignes.push('*Trésorerie :*')
  const tresorerie = dette.detail.filter((d) => d.type === 'tresorerie')
  if (tresorerie.length === 0) {
    lignes.push('  Aucune trésorerie disponible')
  } else {
    for (const t of tresorerie) {
      lignes.push(`  - ${t.libelle} : ${formatK(t.montant)}`)
    }
  }
  lignes.push(`  **Total trésorerie** : ${formatK(dette.totalTresorerie)}`)
  lignes.push('')

  // Résultat
  lignes.push('---')
  const signe = dette.detteFinanciereNette >= 0 ? '' : ''
  lignes.push(`**Dette Financière Nette** : ${signe}${formatK(dette.detteFinanciereNette)}`)
  lignes.push('')

  if (dette.detteFinanciereNette > 0) {
    lignes.push(
      `L'entreprise a ${formatK(dette.detteFinanciereNette)} de dettes nettes. ` +
        `Ce montant sera **déduit** de la Valeur d'Entreprise pour obtenir le Prix de Cession.`
    )
  } else if (dette.detteFinanciereNette < 0) {
    lignes.push(
      `L'entreprise a ${formatK(Math.abs(dette.detteFinanciereNette))} de trésorerie nette. ` +
        `Ce montant sera **ajouté** à la Valeur d'Entreprise pour obtenir le Prix de Cession.`
    )
  } else {
    lignes.push(
      `Les dettes et la trésorerie s'équilibrent. Le Prix de Cession égale la Valeur d'Entreprise.`
    )
  }

  return lignes.join('\n')
}

// ============================================
// UTILITAIRES
// ============================================

function formatK(montant: number): string {
  const absM = Math.abs(montant)
  const prefix = montant < 0 ? '-' : ''

  if (absM >= 1_000_000) {
    return `${prefix}${(absM / 1_000_000).toFixed(1)}M€`
  }
  if (absM >= 1_000) {
    return `${prefix}${(absM / 1_000).toFixed(0)}k€`
  }
  return `${prefix}${absM.toFixed(0)}€`
}

// ============================================
// EXPORTS
// ============================================

export { formatK }
