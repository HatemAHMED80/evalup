// Détection automatique d'anomalies comptables

import type { Anomalie, BilanAnnuel } from '../anthropic'

export function detecterAnomalies(bilans: BilanAnnuel[]): Anomalie[] {
  const anomalies: Anomalie[] = []

  if (bilans.length < 1) return anomalies

  const bilanN = bilans[0]   // Année la plus récente
  const bilanN1 = bilans[1]  // Année précédente
  const bilanN2 = bilans[2]  // N-2 si disponible

  // ========================================
  // 1. ANOMALIES SUR LE BFR
  // ========================================

  // Délai clients qui explose (DSO)
  const dsoN = bilanN.chiffre_affaires > 0
    ? (bilanN.creances_clients / bilanN.chiffre_affaires) * 365
    : 0

  if (dsoN > 90) {
    anomalies.push({
      type: 'alerte',
      categorie: 'Créances clients',
      message: `Tes créances clients représentent ${Math.round(dsoN)} jours de CA, ce qui est très élevé. As-tu des impayés significatifs ?`,
      severity: 'high',
      valeurs: { dsoN }
    })
  } else if (bilanN1 && dsoN > 45) {
    const dsoN1 = bilanN1.chiffre_affaires > 0
      ? (bilanN1.creances_clients / bilanN1.chiffre_affaires) * 365
      : 0
    if (dsoN > dsoN1 * 1.5) {
      anomalies.push({
        type: 'question',
        categorie: 'Créances clients',
        message: `Tes créances clients sont passées de ${Math.round(dsoN1)} à ${Math.round(dsoN)} jours de CA. Y a-t-il une raison particulière ?`,
        severity: 'medium',
        valeurs: { dsoN, dsoN1 }
      })
    }
  }

  // Stock qui augmente plus vite que le CA
  if (bilanN1 && bilanN1.stocks > 0 && bilanN1.chiffre_affaires > 0) {
    const croissanceStock = (bilanN.stocks - bilanN1.stocks) / bilanN1.stocks
    const croissanceCA = (bilanN.chiffre_affaires - bilanN1.chiffre_affaires) / bilanN1.chiffre_affaires

    if (croissanceStock > croissanceCA + 0.3 && croissanceStock > 0.2) {
      anomalies.push({
        type: 'question',
        categorie: 'Stocks',
        message: `Tes stocks ont augmenté de ${Math.round(croissanceStock * 100)}% alors que le CA n'a progressé que de ${Math.round(croissanceCA * 100)}%. Est-ce une anticipation commerciale ou des difficultés d'écoulement ?`,
        severity: 'medium',
        valeurs: { croissanceStock: Math.round(croissanceStock * 100), croissanceCA: Math.round(croissanceCA * 100) }
      })
    }
  }

  // ========================================
  // 2. ANOMALIES SUR LA RENTABILITÉ
  // ========================================

  // Résultat net négatif
  if (bilanN.resultat_net < 0) {
    anomalies.push({
      type: 'alerte',
      categorie: 'Rentabilité',
      message: `Ton résultat net est négatif (${bilanN.resultat_net.toLocaleString('fr-FR')} €). Peux-tu m'expliquer les raisons de cette perte ?`,
      severity: 'high',
      valeurs: { resultatNet: bilanN.resultat_net }
    })
  }

  // Marge nette qui chute
  if (bilanN1 && bilanN.chiffre_affaires > 0 && bilanN1.chiffre_affaires > 0) {
    const margeN = (bilanN.resultat_net / bilanN.chiffre_affaires) * 100
    const margeN1 = (bilanN1.resultat_net / bilanN1.chiffre_affaires) * 100

    if (margeN < margeN1 - 3 && margeN1 > 0) {
      anomalies.push({
        type: 'question',
        categorie: 'Rentabilité',
        message: `Ta marge nette est passée de ${margeN1.toFixed(1)}% à ${margeN.toFixed(1)}%. Qu'est-ce qui explique cette baisse ?`,
        severity: 'medium',
        valeurs: { margeN: margeN.toFixed(1), margeN1: margeN1.toFixed(1) }
      })
    }
  }

  // ========================================
  // 3. ANOMALIES SUR L'ENDETTEMENT
  // ========================================

  // Capitaux propres négatifs
  if (bilanN.capitaux_propres < 0) {
    anomalies.push({
      type: 'alerte',
      categorie: 'Structure financière',
      message: `Tes capitaux propres sont négatifs (${bilanN.capitaux_propres.toLocaleString('fr-FR')} €). C'est un signal d'alerte majeur pour un repreneur. Une recapitalisation est-elle prévue ?`,
      severity: 'high',
      valeurs: { capitauxPropres: bilanN.capitaux_propres }
    })
  }

  // Ratio d'endettement élevé
  const ebitda = bilanN.resultat_exploitation + (bilanN.dotations_amortissements || 0)
  if (ebitda > 0 && bilanN.dettes_financieres > ebitda * 4) {
    const ratio = bilanN.dettes_financieres / ebitda
    anomalies.push({
      type: 'alerte',
      categorie: 'Endettement',
      message: `Tes dettes financières représentent ${ratio.toFixed(1)}x ton EBITDA. C'est un niveau d'endettement élevé. Quelle est l'échéance de ces emprunts ?`,
      severity: 'high',
      valeurs: { dettes: bilanN.dettes_financieres, ebitda, ratio: ratio.toFixed(1) }
    })
  }

  // ========================================
  // 4. ANOMALIES SUR LES PROVISIONS
  // ========================================

  // Nouvelles provisions
  if (bilanN.provisions > 0 && (!bilanN1 || !bilanN1.provisions || bilanN1.provisions === 0)) {
    anomalies.push({
      type: 'question',
      categorie: 'Provisions',
      message: `Une provision de ${bilanN.provisions.toLocaleString('fr-FR')} € est apparue cette année. Peux-tu m'expliquer sa nature (litige, risque, restructuration) ?`,
      severity: 'medium',
      valeurs: { provision: bilanN.provisions }
    })
  }

  // Provisions qui augmentent fortement
  if (bilanN1 && bilanN1.provisions > 0 && bilanN.provisions > bilanN1.provisions * 2) {
    anomalies.push({
      type: 'alerte',
      categorie: 'Provisions',
      message: `Tes provisions ont plus que doublé (${bilanN1.provisions.toLocaleString('fr-FR')} € → ${bilanN.provisions.toLocaleString('fr-FR')} €). Y a-t-il un risque particulier en cours ?`,
      severity: 'high',
      valeurs: { provisionN: bilanN.provisions, provisionN1: bilanN1.provisions }
    })
  }

  // ========================================
  // 5. ANOMALIES SUR LA CROISSANCE
  // ========================================

  if (bilanN1 && bilanN1.chiffre_affaires > 0) {
    const evolutionCA = (bilanN.chiffre_affaires - bilanN1.chiffre_affaires) / bilanN1.chiffre_affaires

    // CA en chute
    if (evolutionCA < -0.15) {
      anomalies.push({
        type: 'alerte',
        categorie: 'Activité',
        message: `Ton CA a chuté de ${Math.abs(Math.round(evolutionCA * 100))}% en un an. Quelles sont les causes de cette baisse ?`,
        severity: 'high',
        valeurs: { evolutionCA: Math.round(evolutionCA * 100) }
      })
    } else if (evolutionCA < -0.05) {
      anomalies.push({
        type: 'question',
        categorie: 'Activité',
        message: `Ton CA a légèrement baissé (${Math.round(evolutionCA * 100)}%). Est-ce conjoncturel ou structurel ?`,
        severity: 'low',
        valeurs: { evolutionCA: Math.round(evolutionCA * 100) }
      })
    }

    // Vérifier tendance sur 3 ans si disponible
    if (bilanN2 && bilanN2.chiffre_affaires > 0 && evolutionCA < 0) {
      const evolutionCA_3ans = (bilanN.chiffre_affaires - bilanN2.chiffre_affaires) / bilanN2.chiffre_affaires

      if (evolutionCA_3ans < 0) {
        anomalies.push({
          type: 'alerte',
          categorie: 'Tendance',
          message: `Ton CA est en baisse depuis au moins 2 ans (${Math.round(evolutionCA_3ans * 100)}% sur 3 ans). As-tu un plan de redressement ?`,
          severity: 'high',
          valeurs: { evolutionCA_3ans: Math.round(evolutionCA_3ans * 100) }
        })
      }
    }
  }

  // ========================================
  // 6. POINTS POSITIFS (INFO)
  // ========================================

  if (bilanN1 && bilanN1.chiffre_affaires > 0) {
    const evolutionCA = (bilanN.chiffre_affaires - bilanN1.chiffre_affaires) / bilanN1.chiffre_affaires

    // Forte croissance
    if (evolutionCA > 0.20) {
      anomalies.push({
        type: 'info',
        categorie: 'Croissance',
        message: `Excellente croissance de ${Math.round(evolutionCA * 100)}% du CA. Cette dynamique est très valorisante. Est-elle reproductible ?`,
        severity: 'low',
        valeurs: { evolutionCA: Math.round(evolutionCA * 100) }
      })
    }
  }

  // Trésorerie confortable
  if (bilanN.tresorerie > 0 && bilanN.chiffre_affaires > 0 && bilanN.tresorerie > bilanN.chiffre_affaires / 4) {
    const moisCA = Math.round(bilanN.tresorerie / bilanN.chiffre_affaires * 12)
    anomalies.push({
      type: 'info',
      categorie: 'Trésorerie',
      message: `Tu disposes d'une trésorerie confortable (${bilanN.tresorerie.toLocaleString('fr-FR')} €, soit ${moisCA} mois de CA). C'est un point fort pour la valorisation.`,
      severity: 'low',
      valeurs: { tresorerie: bilanN.tresorerie, moisCA }
    })
  }

  return anomalies
}

// Convertir les bilans normalisés en format BilanAnnuel
export function convertirBilansNormalises(bilans: Array<{
  annee: number
  chiffreAffaires: number
  resultatNet: number
  resultatExploitation: number
  ebitda: number
  tresorerie: number
  stocks: number
  creancesClients: number
  capitauxPropres: number
  dettesFinancieres: number
  dettesFournisseurs: number
}>): BilanAnnuel[] {
  return bilans.map(b => ({
    annee: b.annee,
    chiffre_affaires: b.chiffreAffaires,
    resultat_net: b.resultatNet,
    resultat_exploitation: b.resultatExploitation,
    dotations_amortissements: b.ebitda - b.resultatExploitation,
    stocks: b.stocks,
    creances_clients: b.creancesClients,
    tresorerie: b.tresorerie,
    capitaux_propres: b.capitauxPropres,
    dettes_financieres: b.dettesFinancieres,
    dettes_fournisseurs: b.dettesFournisseurs,
    provisions: 0,
  }))
}
