/**
 * Backtest du calculateur d'évaluation V1
 *
 * Exécute ~105 entreprises synthétiques sur evaluerEntreprise() et evaluerRapide(),
 * puis vérifie 12 invariants méthodologiques par entreprise.
 *
 * Usage: npx tsx tests/backtest-calculateur.ts
 */

import { evaluerEntreprise, evaluerRapide } from '../src/lib/evaluation/calculateur'
import type { DonneesFinancieres, FacteursAjustement, ResultatEvaluation } from '../src/lib/evaluation/types'
import { SECTEURS } from '../src/lib/evaluation/secteurs'

// ============================================
// TYPES
// ============================================

interface TestCase {
  nom: string
  codeNaf: string
  donnees: DonneesFinancieres
  facteurs?: FacteursAjustement
}

interface InvariantResult {
  code: string
  pass: boolean
  detail: string
}

interface TestResult {
  nom: string
  secteur: string
  invariants: InvariantResult[]
  valorisation?: { basse: number; moyenne: number; haute: number }
  error?: string
}

// ============================================
// COULEURS ANSI
// ============================================

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const DIM = '\x1b[2m'
const BOLD = '\x1b[1m'
const RESET = '\x1b[0m'

// ============================================
// PROFILS D'ENTREPRISES RÉUTILISABLES
// ============================================

function pmeRentable(ca: number, margeEbitda = 0.15): Omit<DonneesFinancieres, 'arr' | 'mrr'> {
  const ebitda = ca * margeEbitda
  return {
    ca,
    ebitda,
    resultatNet: ebitda * 0.5,
    capitauxPropres: ca * 0.25,
    actifNet: ca * 0.3,
    tresorerie: ca * 0.05,
    dettes: ca * 0.10,
  }
}

function micro(ca: number): DonneesFinancieres {
  return {
    ca,
    ebitda: ca * 0.20,
    resultatNet: ca * 0.10,
    capitauxPropres: ca * 0.25,
    actifNet: ca * 0.30,
    tresorerie: ca * 0.15,
    dettes: ca * 0.05,
  }
}

function grossePme(ca: number): DonneesFinancieres {
  return {
    ca,
    ebitda: ca * 0.17,
    resultatNet: ca * 0.08,
    capitauxPropres: ca * 0.33,
    actifNet: ca * 0.40,
    tresorerie: ca * 0.03,
    dettes: ca * 0.20,
  }
}

function deficitaire(ca: number): DonneesFinancieres {
  return {
    ca,
    ebitda: -ca * 0.05,
    resultatNet: -ca * 0.10,
    capitauxPropres: ca * 0.10,
    actifNet: ca * 0.15,
    tresorerie: ca * 0.02,
    dettes: ca * 0.30,
  }
}

function tresEndette(ca: number): DonneesFinancieres {
  return {
    ca,
    ebitda: ca * 0.13,
    resultatNet: ca * 0.03,
    capitauxPropres: ca * 0.07,
    actifNet: ca * 0.10,
    tresorerie: ca * 0.02,
    dettes: ca * 0.67,
  }
}

function cashRich(ca: number): DonneesFinancieres {
  return {
    ca,
    ebitda: ca * 0.13,
    resultatNet: ca * 0.07,
    capitauxPropres: ca * 0.50,
    actifNet: ca * 0.55,
    tresorerie: ca * 0.27,
    dettes: ca * 0.03,
  }
}

function forteCroissance(ca: number): DonneesFinancieres {
  return {
    ca,
    ebitda: ca * 0.16,
    resultatNet: ca * 0.08,
    capitauxPropres: ca * 0.20,
    actifNet: ca * 0.25,
    tresorerie: ca * 0.06,
    dettes: ca * 0.10,
    croissance: 0.40,
  }
}

// ============================================
// GÉNÉRATION DU PANEL
// ============================================

function genererPanel(): TestCase[] {
  const panel: TestCase[] = []

  // --- Configuration par secteur ---
  // { secteurCode, nafCode, caBase, profils spécifiques }

  const secteurConfigs: {
    code: string
    naf: string
    caBase: number
    extras?: TestCase[]
  }[] = [
    // Santé — sous-secteurs
    {
      code: 'pharmacie', naf: '47.73Z', caBase: 2_000_000,
      extras: [{
        nom: 'Pharmacie rurale monopole',
        codeNaf: '47.73Z',
        donnees: { ...pmeRentable(1_500_000, 0.08), tresorerie: 200_000, dettes: 100_000 },
      }],
    },
    {
      code: 'labo', naf: '86.90B', caBase: 5_000_000,
      extras: [{
        nom: 'Labo multi-sites',
        codeNaf: '86.90B',
        donnees: { ...grossePme(12_000_000) },
      }],
    },
    {
      code: 'medecin', naf: '86.21Z', caBase: 300_000,
      extras: [{
        nom: 'Spécialiste secteur 2',
        codeNaf: '86.22C',
        donnees: { ...pmeRentable(500_000, 0.35) },
      }],
    },
    {
      code: 'dentaire', naf: '86.23Z', caBase: 400_000,
      extras: [{
        nom: 'Cabinet dentaire groupe',
        codeNaf: '86.23Z',
        donnees: { ...pmeRentable(800_000, 0.30) },
      }],
    },
    {
      code: 'paramedical', naf: '86.90E', caBase: 200_000,
      extras: [{
        nom: 'Ambulancier avec agréments',
        codeNaf: '86.90A',
        donnees: { ...pmeRentable(600_000, 0.12), immobilisationsCorporelles: 250_000 },
      }],
    },

    // Transport
    {
      code: 'transport', naf: '49.41A', caBase: 3_000_000,
      extras: [{
        nom: 'Transporteur avec flotte propre',
        codeNaf: '49.41B',
        donnees: { ...pmeRentable(5_000_000, 0.10), immobilisationsCorporelles: 1_800_000 },
      }, {
        nom: 'Transporteur flotte leasing',
        codeNaf: '49.41A',
        donnees: { ...pmeRentable(4_000_000, 0.12), immobilisationsCorporelles: 50_000 },
      }],
    },

    // SaaS
    {
      code: 'saas', naf: '62.01Z', caBase: 2_000_000,
      extras: [{
        nom: 'SaaS early-stage forte croissance',
        codeNaf: '62.01Z',
        donnees: {
          ca: 500_000, ebitda: -100_000, resultatNet: -150_000,
          capitauxPropres: 200_000, actifNet: 250_000,
          tresorerie: 300_000, dettes: 50_000,
          arr: 600_000, mrr: 50_000, croissance: 0.80, churn: 0.02,
        },
      }, {
        nom: 'SaaS rentable mature',
        codeNaf: '62.01Z',
        donnees: {
          ca: 8_000_000, ebitda: 2_400_000, resultatNet: 1_200_000,
          capitauxPropres: 3_000_000, actifNet: 3_500_000,
          tresorerie: 1_000_000, dettes: 500_000,
          arr: 8_500_000, mrr: 708_000, croissance: 0.25, churn: 0.01,
        },
      }, {
        nom: 'SaaS hypercroissance',
        codeNaf: '58.29A',
        donnees: {
          ca: 3_000_000, ebitda: 100_000, resultatNet: -200_000,
          capitauxPropres: 500_000, actifNet: 600_000,
          tresorerie: 2_000_000, dettes: 200_000,
          arr: 4_000_000, mrr: 333_000, croissance: 1.50, churn: 0.03,
        },
      }],
    },

    // Restaurant
    {
      code: 'restaurant', naf: '56.10A', caBase: 500_000,
      extras: [{
        nom: 'Restaurant étoilé',
        codeNaf: '56.10A',
        donnees: { ...pmeRentable(1_500_000, 0.20) },
      }],
    },

    // Commerce
    {
      code: 'commerce', naf: '47.11A', caBase: 1_000_000,
      extras: [{
        nom: 'Boulangerie artisanale',
        codeNaf: '47.24Z',
        donnees: { ...micro(350_000) },
      }],
    },

    // E-commerce
    {
      code: 'ecommerce', naf: '47.91A', caBase: 2_000_000,
      extras: [{
        nom: 'E-commerce niche rentable',
        codeNaf: '47.91B',
        donnees: { ...pmeRentable(800_000, 0.25) },
      }],
    },

    // BTP
    {
      code: 'btp', naf: '43.11Z', caBase: 3_000_000,
      extras: [{
        nom: 'BTP avec parc matériel',
        codeNaf: '41.20A',
        donnees: { ...pmeRentable(6_000_000, 0.12), immobilisationsCorporelles: 2_000_000 },
      }],
    },

    // Industrie
    {
      code: 'industrie', naf: '25.11Z', caBase: 5_000_000,
      extras: [{
        nom: 'Industrie avec historique 3 ans',
        codeNaf: '25.12Z',
        donnees: {
          ...pmeRentable(7_000_000, 0.14),
          historique: [
            { ca: 7_000_000, ebitda: 980_000, resultatNet: 490_000, annee: 2024 },
            { ca: 6_500_000, ebitda: 910_000, resultatNet: 455_000, annee: 2023 },
            { ca: 6_000_000, ebitda: 840_000, resultatNet: 420_000, annee: 2022 },
          ],
        },
      }, {
        nom: 'Industrie propriétaire immobilier',
        codeNaf: '28.11Z',
        donnees: { ...grossePme(15_000_000), immobilisationsCorporelles: 5_000_000 },
      }],
    },

    // Services
    {
      code: 'services', naf: '70.22Z', caBase: 1_500_000,
      extras: [{
        nom: 'Cabinet conseil premium',
        codeNaf: '70.22Z',
        donnees: { ...pmeRentable(3_000_000, 0.25) },
      }],
    },

    // Default (code NAF inconnu)
    {
      code: 'default', naf: '99.99Z', caBase: 1_000_000,
    },
  ]

  // Générer les 7 profils de base pour chaque secteur
  for (const cfg of secteurConfigs) {
    const ca = cfg.caBase

    // 1. PME rentable
    panel.push({
      nom: `${cfg.code} — PME rentable`,
      codeNaf: cfg.naf,
      donnees: pmeRentable(ca),
    })

    // 2. Micro
    panel.push({
      nom: `${cfg.code} — Micro`,
      codeNaf: cfg.naf,
      donnees: micro(ca * 0.1),
    })

    // 3. Grosse PME
    panel.push({
      nom: `${cfg.code} — Grosse PME`,
      codeNaf: cfg.naf,
      donnees: grossePme(ca * 5),
    })

    // 4. Déficitaire
    panel.push({
      nom: `${cfg.code} — Déficitaire`,
      codeNaf: cfg.naf,
      donnees: deficitaire(ca),
    })

    // 5. Très endetté
    panel.push({
      nom: `${cfg.code} — Très endetté`,
      codeNaf: cfg.naf,
      donnees: tresEndette(ca),
    })

    // 6. Cash-rich
    panel.push({
      nom: `${cfg.code} — Cash-rich`,
      codeNaf: cfg.naf,
      donnees: cashRich(ca),
    })

    // 7. Forte croissance
    panel.push({
      nom: `${cfg.code} — Forte croissance`,
      codeNaf: cfg.naf,
      donnees: forteCroissance(ca),
    })

    // Extras sectoriels
    if (cfg.extras) {
      panel.push(...cfg.extras)
    }
  }

  return panel
}

// ============================================
// VÉRIFICATION DES 12 INVARIANTS
// ============================================

function verifierInvariants(
  tc: TestCase,
  r: ResultatEvaluation,
  rapide: { basse: number; moyenne: number; haute: number },
): InvariantResult[] {
  const results: InvariantResult[] = []
  const v = r.valorisation

  // 1. POSITIF
  results.push({
    code: 'POSITIF',
    pass: v.moyenne > 0,
    detail: `moyenne = ${fmt(v.moyenne)}`,
  })

  // 2. ORDERING
  results.push({
    code: 'ORDERING',
    pass: v.basse <= v.moyenne && v.moyenne <= v.haute,
    detail: `${fmt(v.basse)} ≤ ${fmt(v.moyenne)} ≤ ${fmt(v.haute)}`,
  })

  // 3. SPREAD
  // Très endetté / déficitaire → spread naturellement large (plancher basse, haute intacte)
  const spread = v.basse > 0 ? v.haute / v.basse : Infinity
  // Seuil souple pour déficitaires : plancher clamp basse mais haute reste calculée normalement
  const spreadLimit = tc.donnees.ebitda < 0 ? 30 : 8
  results.push({
    code: 'SPREAD',
    pass: spread < spreadLimit,
    detail: `haute/basse = ${spread.toFixed(2)}×${tc.donnees.ebitda < 0 ? ' (déficitaire, seuil=' + spreadLimit + ')' : ''}`,
  })

  // 4. FLOOR
  const floorMin = Math.min(5000, tc.donnees.ca * 0.15)
  results.push({
    code: 'FLOOR',
    pass: v.basse >= floorMin * 0.9, // 10% de tolérance
    detail: `basse=${fmt(v.basse)}, floor=${fmt(floorMin)}`,
  })

  // 5. BRIDGE_COHERENT
  // Tolérance large car : ajustements appliqués à equity mais pas à VE reportée,
  // plancher qui clamp basse, blend EV/equity avec poids différents.
  const usesPlancher = r.methodes.some(m => m.nom.includes('plancher'))
  if (usesPlancher) {
    // Plancher override → bridge n'est plus pertinent
    results.push({
      code: 'BRIDGE',
      pass: true,
      detail: 'plancher actif — bridge non applicable',
    })
  } else if (r.valeurEntreprise && r.detteNette !== undefined) {
    const veEquity = r.valeurEntreprise.moyenne - r.detteNette
    const base = Math.max(v.moyenne, Math.abs(veEquity), 1)
    const ecart = Math.abs(veEquity - v.moyenne) / base
    // Tolérance 50% : ajustements et blend EV/equity expliquent l'écart
    results.push({
      code: 'BRIDGE',
      pass: ecart < 0.50,
      detail: `VE(${fmt(r.valeurEntreprise.moyenne)}) - DFN(${fmt(r.detteNette)}) = ${fmt(veEquity)} vs equity ${fmt(v.moyenne)} (écart ${(ecart * 100).toFixed(1)}%)`,
    })
  } else {
    results.push({
      code: 'BRIDGE',
      pass: true,
      detail: 'pas de VE (méthodes equity only)',
    })
  }

  // 6. DETTE_EFFECT
  // Quand equity-methods dominent (ex: secteurs santé avec praticiens=30%),
  // la valorisation blendée peut dépasser la VE malgré la dette.
  // On vérifie seulement si 100% des méthodes sont EV-based.
  if (r.valeurEntreprise && tc.donnees.dettes > tc.donnees.tresorerie) {
    const allEV = r.methodes.length > 0 && r.methodes.every(m => {
      const code = m.nom.toLowerCase()
      return !code.includes('actif net') && !code.includes('praticien') && !code.includes('goodwill')
    })
    results.push({
      code: 'DETTE_EFFECT',
      pass: !allEV || r.valeurEntreprise.moyenne >= v.moyenne * 0.95,
      detail: `VE=${fmt(r.valeurEntreprise.moyenne)} vs Equity=${fmt(v.moyenne)} (dettes ${fmt(tc.donnees.dettes)} > tréso ${fmt(tc.donnees.tresorerie)})`,
    })
  } else {
    results.push({
      code: 'DETTE_EFFECT',
      pass: true,
      detail: 'tréso ≥ dettes ou pas de VE',
    })
  }

  // 7. METHODS_NONZERO
  const methodesNonZero = r.methodes.filter(m => m.valeur > 0).length
  results.push({
    code: 'METHODS_OK',
    pass: methodesNonZero >= 1,
    detail: `${methodesNonZero}/${r.methodes.length} méthodes > 0`,
  })

  // 8. POIDS_100
  const sommePoids = r.methodes.reduce((s, m) => s + m.poids, 0)
  results.push({
    code: 'POIDS_100',
    pass: Math.abs(sommePoids - 100) < 5,
    detail: `somme poids = ${sommePoids}%`,
  })

  // 9. ADJ_CAPPED
  const totalPrimes = r.ajustements
    .filter(a => a.impact > 0)
    .reduce((s, a) => s + a.impact, 0)
  const totalDecotes = r.ajustements
    .filter(a => a.impact < 0)
    .reduce((s, a) => s + a.impact, 0)
  results.push({
    code: 'ADJ_CAPPED',
    pass: totalPrimes <= 0.51 && totalDecotes >= -0.46, // petite tolérance arrondi
    detail: `primes=${(totalPrimes * 100).toFixed(0)}%, décotes=${(totalDecotes * 100).toFixed(0)}%`,
  })

  // 10. RAPIDE_ALIGN
  // evaluerRapide ne gère pas le bridge dette → divergence naturelle pour cas extrêmes
  const ratioRapide = rapide.moyenne > 0 && v.moyenne > 0
    ? Math.max(rapide.moyenne / v.moyenne, v.moyenne / rapide.moyenne)
    : Infinity
  results.push({
    code: 'RAPIDE_ALIGN',
    pass: ratioRapide < 8,
    detail: `rapide=${fmt(rapide.moyenne)}, complet=${fmt(v.moyenne)}, ratio=${ratioRapide.toFixed(2)}×`,
  })

  // 11. MULT_REASONABLE
  const multCA = tc.donnees.ca > 0 ? v.moyenne / tc.donnees.ca : 0
  results.push({
    code: 'MULT_OK',
    pass: multCA >= 0.01 && multCA <= 25,
    detail: `valorisation/CA = ${multCA.toFixed(2)}×`,
  })

  // 12. NO_NAN
  const hasNaN = [v.basse, v.moyenne, v.haute].some(x => isNaN(x) || !isFinite(x))
    || r.methodes.some(m => isNaN(m.valeur) || !isFinite(m.valeur))
  results.push({
    code: 'NO_NAN',
    pass: !hasNaN,
    detail: hasNaN ? 'NaN/Infinity détecté !' : 'OK',
  })

  return results
}

// ============================================
// FORMAT HELPERS
// ============================================

function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M€`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K€`
  return `${Math.round(n)}€`
}

// ============================================
// RUNNER
// ============================================

function runBacktest(): { total: number; passed: number; failed: number; results: TestResult[] } {
  const panel = genererPanel()
  const results: TestResult[] = []

  for (const tc of panel) {
    try {
      const resultat = evaluerEntreprise(tc.codeNaf, tc.donnees, tc.facteurs)
      const rapide = evaluerRapide(tc.codeNaf, tc.donnees.ca, tc.donnees.ebitda, tc.donnees.resultatNet)
      const invariants = verifierInvariants(tc, resultat, rapide)

      results.push({
        nom: tc.nom,
        secteur: resultat.secteur.code,
        invariants,
        valorisation: resultat.valorisation,
      })
    } catch (err) {
      results.push({
        nom: tc.nom,
        secteur: '???',
        invariants: [{
          code: 'CRASH',
          pass: false,
          detail: `${err}`,
        }],
        error: `${err}`,
      })
    }
  }

  const passed = results.filter(r => r.invariants.every(i => i.pass)).length
  const failed = results.length - passed

  return { total: results.length, passed, failed, results }
}

// ============================================
// RAPPORT
// ============================================

function afficherRapport(bt: ReturnType<typeof runBacktest>) {
  const BAR = '═'.repeat(60)
  const LINE = '─'.repeat(60)

  console.log(`\n${BOLD}${BAR}${RESET}`)
  console.log(`${BOLD}  BACKTEST CALCULATEUR — ${bt.total} entreprises${RESET}`)
  console.log(`${BOLD}${BAR}${RESET}\n`)

  // Détail par entreprise
  for (const r of bt.results) {
    const allPass = r.invariants.every(i => i.pass)
    const passCount = r.invariants.filter(i => i.pass).length
    const icon = allPass ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`
    const secteurTag = `[${r.secteur}]`.padEnd(16)
    const nomTag = r.nom.padEnd(42)
    const valorTag = r.valorisation
      ? `${DIM}${fmt(r.valorisation.basse)}–${fmt(r.valorisation.haute)}${RESET}`
      : ''

    console.log(`${icon} ${DIM}${secteurTag}${RESET} ${nomTag} ${passCount}/${r.invariants.length} ${valorTag}`)

    // Afficher les échecs
    const failures = r.invariants.filter(i => !i.pass)
    for (const f of failures) {
      console.log(`  ${RED}└─ ${f.code}: ${f.detail}${RESET}`)
    }
  }

  // Résumé par secteur
  console.log(`\n${LINE}`)
  console.log(`${BOLD}RÉSUMÉ PAR SECTEUR${RESET}`)
  console.log(LINE)

  const parSecteur = new Map<string, { total: number; pass: number }>()
  for (const r of bt.results) {
    const s = parSecteur.get(r.secteur) || { total: 0, pass: 0 }
    s.total++
    if (r.invariants.every(i => i.pass)) s.pass++
    parSecteur.set(r.secteur, s)
  }

  for (const [secteur, s] of [...parSecteur.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const allOk = s.pass === s.total
    const icon = allOk ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`
    console.log(`${secteur.padEnd(16)} : ${s.pass}/${s.total}  ${icon}`)
  }

  // Résumé par invariant
  console.log(`\n${LINE}`)
  console.log(`${BOLD}RÉSUMÉ PAR INVARIANT${RESET}`)
  console.log(LINE)

  const parInvariant = new Map<string, { total: number; pass: number }>()
  for (const r of bt.results) {
    for (const inv of r.invariants) {
      const s = parInvariant.get(inv.code) || { total: 0, pass: 0 }
      s.total++
      if (inv.pass) s.pass++
      parInvariant.set(inv.code, s)
    }
  }

  for (const [code, s] of [...parInvariant.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const allOk = s.pass === s.total
    const icon = allOk ? `${GREEN}✓${RESET}` : `${YELLOW}${s.pass}/${s.total}${RESET}`
    console.log(`${code.padEnd(16)} : ${icon}`)
  }

  // Total
  const totalInvariants = bt.results.reduce((s, r) => s + r.invariants.length, 0)
  const passInvariants = bt.results.reduce((s, r) => s + r.invariants.filter(i => i.pass).length, 0)
  const pctEntreprises = ((bt.passed / bt.total) * 100).toFixed(1)
  const pctInvariants = ((passInvariants / totalInvariants) * 100).toFixed(1)

  console.log(`\n${BOLD}${BAR}${RESET}`)
  const statusColor = bt.failed === 0 ? GREEN : RED
  console.log(`${statusColor}${BOLD}TOTAL: ${bt.passed}/${bt.total} entreprises OK (${pctEntreprises}%)${RESET}`)
  console.log(`${statusColor}${BOLD}       ${passInvariants}/${totalInvariants} invariants OK (${pctInvariants}%)${RESET}`)
  console.log(`${BOLD}${BAR}${RESET}\n`)
}

// ============================================
// MAIN
// ============================================

console.log(`\nSecteurs chargés: ${SECTEURS.length}`)
console.log(`Secteurs: ${SECTEURS.map(s => s.code).join(', ')}`)

const bt = runBacktest()
afficherRapport(bt)

process.exit(bt.failed > 0 ? 1 : 0)
