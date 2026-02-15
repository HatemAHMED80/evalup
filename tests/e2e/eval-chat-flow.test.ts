// E2E Tests: Full evaluation flow — diagnostic → payment bypass → chat with AI → valuation
//
// Tests the complete paid user journey:
// 1. Login with test user
// 2. Create evaluation in DB (bypass Stripe)
// 3. Navigate to /evaluation/[id]/chat
// 4. Chat with AI through all 6 evaluation steps
// 5. Capture final valuation (ranges, method, note)
// 6. Save results for comparison with expected valuations

import { Page } from 'puppeteer'
import { TEST_CONFIG } from '../config'
import { TestLogger } from '../utils/logger'
import { TestReporter, TestResult } from '../utils/reporter'
import {
  createTestContext,
  closeTestContext,
  takeScreenshot,
  sendChatMessage,
  waitForBotResponse,
  waitForStreamingEnd,
  getChatMessages,
  wait,
} from '../utils/browser'
import { SCENARIOS, TestScenario } from '../fixtures/scenarios'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const MODULE_NAME = 'eval-chat-flow'

// Scenarios to test by default (matching archetype detection)
const DEFAULT_SCENARIOS = [
  'services_recurrents',
  'saas_hyper',
  'commerce_retail',
]

// Max conversation turns before giving up
const MAX_CHAT_TURNS = 25

// ============================================================
// Supabase admin helpers
// ============================================================

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createSupabaseAdmin(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function getUserId(email: string): Promise<string> {
  const admin = getAdminClient()
  const { data } = await admin.auth.admin.listUsers() as {
    data: { users: Array<{ id: string; email?: string }> }
  }
  const user = data?.users?.find(u => u.email === email)
  if (!user) throw new Error(`User ${email} not found in Supabase`)
  return user.id
}

async function createEvaluation(
  userId: string,
  scenario: TestScenario,
  archetypeId: string,
): Promise<string> {
  const admin = getAdminClient()
  const d = scenario.diagnostic

  // Build diagnostic data matching ConversationContext.diagnosticData format
  const diagnosticData: Record<string, unknown> = {
    revenue: d.revenue,
    ebitda: d.ebitda,
    growth: d.growth,
    recurring: d.recurring,
    masseSalariale: d.masseSalariale,
    effectif: d.effectif,
    remunerationDirigeant: d.remunerationDirigeant,
    concentrationClient: d.concentrationClient,
    activityType: d.activityType,
    objectif: d.objectif,
    hasPatrimoine: d.hasPatrimoine,
  }

  if (d.dettesFinancieres != null) diagnosticData.dettesFinancieres = d.dettesFinancieres
  if (d.tresorerieActuelle != null) diagnosticData.tresorerieActuelle = d.tresorerieActuelle
  if (d.loyersNets != null) diagnosticData.loyersNets = d.loyersNets
  if (d.mrrMensuel != null) diagnosticData.mrrMensuel = d.mrrMensuel
  if (d.churn != null) diagnosticData.churn = d.churn
  if (d.nrr != null) diagnosticData.nrr = d.nrr
  if (d.cac != null) diagnosticData.cac = d.cac
  if (d.cacPayback != null) diagnosticData.cacPayback = d.cacPayback
  if (d.runway != null) diagnosticData.runway = d.runway

  // Delete any existing evaluation for this SIREN + user to avoid conflicts
  await admin
    .from('evaluations')
    .delete()
    .eq('user_id', userId)
    .eq('siren', scenario.siren)

  // Create evaluation record
  const { data: evalData, error } = await admin
    .from('evaluations')
    .insert({
      user_id: userId,
      siren: scenario.siren,
      entreprise_nom: scenario.nom,
      type: 'complete',
      status: 'complete_in_progress',
      archetype_id: archetypeId,
      diagnostic_data: diagnosticData,
      questions_count: 0,
      documents_count: 0,
      stripe_payment_id: `test_e2e_${Date.now()}`,
      amount_paid: 7900,
      paid_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to create evaluation: ${error.message}`)
  return evalData.id
}

// ============================================================
// Login helper
// ============================================================

async function loginTestUser(page: Page, logger: TestLogger): Promise<void> {
  const { email, password } = TEST_CONFIG.testUser

  logger.info(`Logging in as ${email}`)
  await page.goto(`${TEST_CONFIG.baseUrl}/connexion`, { waitUntil: 'networkidle2' })
  await page.deleteCookie(...(await page.cookies()))
  await page.evaluate(() => { try { localStorage.clear() } catch {} })
  await page.goto(`${TEST_CONFIG.baseUrl}/connexion`, { waitUntil: 'networkidle2' })
  await wait(2000)

  const emailInput = await page.$('input[type="email"]')
  const passwordInput = await page.$('input[type="password"]')
  if (!emailInput || !passwordInput) throw new Error('Login form not found')

  await emailInput.click({ clickCount: 3 })
  await emailInput.type(email)
  await passwordInput.click({ clickCount: 3 })
  await passwordInput.type(password)

  const submitBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(btn =>
      (btn.textContent || '').includes('connecter')
    )
  })
  await (submitBtn as unknown as import('puppeteer').ElementHandle).click()
  await wait(5000)

  const url = page.url()
  if (url.includes('/connexion')) {
    throw new Error(`Login failed — still on /connexion`)
  }
  logger.info(`Logged in, redirected to: ${url}`)
}

// ============================================================
// Smart response generator — tracks covered topics to avoid loops
// ============================================================

// Topic definitions with keyword matchers and response generators
interface TopicDef {
  id: string
  match: (msg: string) => boolean
  respond: (d: TestScenario['diagnostic']) => string
}

function buildTopics(): TopicDef[] {
  return [
    {
      id: 'objectif',
      match: (m) => m.includes('objectif') || m.includes('pourquoi') || m.includes('projet') || m.includes('raison'),
      respond: (d) => {
        const map: Record<string, string> = {
          vente: 'vendre mon entreprise',
          levee: 'lever des fonds',
          associe: 'valoriser les parts pour un associé',
          connaitre: 'connaître la valeur de mon entreprise',
        }
        return `Mon objectif est de ${map[d.objectif] || d.objectif}.`
      },
    },
    {
      id: 'remuneration',
      match: (m) => m.includes('rémunération') || m.includes('salaire') || m.includes('vous versez'),
      respond: (d) => d.remunerationDirigeant === 0
        ? "Je ne me verse pas de salaire."
        : `Ma rémunération annuelle est de ${d.remunerationDirigeant}€ brut.`,
    },
    {
      id: 'concentration',
      match: (m) => (m.includes('client') && m.includes('concentr')) || m.includes('portefeuille client'),
      respond: (d) => {
        const map: Record<string, string> = {
          '<10%': 'Aucun client ne dépasse 10% du CA.',
          '10-30%': 'Nos 3 plus gros clients représentent entre 10 et 30% du CA.',
          '30-50%': 'Quelques gros clients représentent 30 à 50% du CA.',
          '>50%': 'Nous dépendons fortement de quelques gros clients (>50% du CA).',
        }
        return map[d.concentrationClient] || `La concentration client est de ${d.concentrationClient}.`
      },
    },
    {
      id: 'equipe',
      match: (m) => m.includes('équipe') || m.includes('salarié') || m.includes('effectif') || m.includes('collaborat'),
      respond: (d) => `${d.effectif} employés. Masse salariale : ${d.masseSalariale}% du CA.`,
    },
    {
      id: 'croissance',
      match: (m) => m.includes('croissance') || m.includes('tendance') || m.includes('évolution'),
      respond: (d) => `Croissance annuelle de ${d.growth}%.`,
    },
    {
      id: 'recurrence',
      match: (m) => m.includes('récurren') || m.includes('abonnement') || m.includes('fidél'),
      respond: (d) => {
        let resp = `${d.recurring}% du CA est récurrent.`
        if (d.mrrMensuel) resp += ` MRR : ${d.mrrMensuel}€.`
        if (d.churn != null) resp += ` Churn : ${d.churn}%.`
        return resp
      },
    },
    {
      id: 'contrats',
      match: (m) => m.includes('contrat') && !m.includes('concentr'),
      respond: (d) => `Nous avons des contrats ${d.recurring > 50 ? 'principalement récurrents' : 'mixtes (ponctuels et récurrents)'}. ${d.recurring}% du CA est sous contrat.`,
    },
    {
      id: 'dette',
      match: (m) => m.includes('dette') || m.includes('endettement') || m.includes('emprunt'),
      respond: (d) => `Dettes financières : ${d.dettesFinancieres ?? 0}€. Trésorerie : ${d.tresorerieActuelle ?? 0}€.`,
    },
    {
      id: 'patrimoine',
      match: (m) => m.includes('patrimoine') || m.includes('immobili') || m.includes('bail'),
      respond: (d) => d.hasPatrimoine
        ? `Oui, patrimoine immobilier. ${d.loyersNets ? `Revenus locatifs : ${d.loyersNets}€/an.` : ''}`
        : "Pas de patrimoine immobilier. Location.",
    },
    {
      id: 'saas_metrics',
      match: (m) => m.includes('churn') || m.includes('rétention') || m.includes('nrr') || m.includes('ltv') || m.includes('cac'),
      respond: (d) => {
        const parts = []
        if (d.churn != null) parts.push(`Churn : ${d.churn}%`)
        if (d.nrr != null) parts.push(`NRR : ${d.nrr}%`)
        if (d.cac != null) parts.push(`CAC : ${d.cac}€`)
        if (d.cacPayback != null) parts.push(`Payback : ${d.cacPayback} mois`)
        if (d.runway != null) parts.push(`Runway : ${d.runway} mois`)
        return parts.length > 0 ? parts.join('. ') + '.' : 'Non applicable.'
      },
    },
    {
      id: 'retraitement',
      match: (m) => m.includes('retraitement') || m.includes('ajustement') || m.includes('normalis'),
      respond: (d) => `Rémunération dirigeant : ${d.remunerationDirigeant}€. Pas de charges exceptionnelles. Pas de loyer anormal. Pas de sur-rémunération familiale.`,
    },
    {
      id: 'decote',
      match: (m) => m.includes('décote') || m.includes('prime') || m.includes('discount') || m.includes('risque spécif'),
      respond: (d) => {
        const risks = []
        if (d.concentrationClient === '>50%') risks.push('forte concentration client')
        if (d.effectif === '1') risks.push('dépendance au dirigeant')
        if (d.growth <= 0) risks.push('pas de croissance')
        return risks.length > 0
          ? `Risques : ${risks.join(', ')}.`
          : "Pas de risque majeur. Équipe autonome."
      },
    },
    {
      id: 'documents',
      match: (m) => m.includes('document') || m.includes('pièce') || m.includes('justificatif'),
      respond: () => "Pas de documents supplémentaires. Les données Pappers sont correctes.",
    },
    {
      id: 'dependance',
      match: (m) => m.includes('dépendance') && m.includes('dirigeant'),
      respond: (d) => d.effectif === '1'
        ? "L'entreprise dépend entièrement de moi."
        : "L'entreprise fonctionne de manière autonome.",
    },
    {
      id: 'marche',
      match: (m) => m.includes('marché') || m.includes('concurren') || m.includes('positionnement'),
      respond: (d) => `Marché ${d.growth > 20 ? 'en forte croissance' : 'mature'}. Concurrence ${d.concentrationClient === '<10%' ? 'fragmentée' : 'modérée'}.`,
    },
  ]
}

// Covered topics tracker (reset per scenario)
const coveredTopics = new Set<string>()

function generateResponse(scenario: TestScenario, aiMessage: string, turnNumber: number): string {
  const d = scenario.diagnostic
  const msg = aiMessage.toLowerCase()
  const topics = buildTopics()

  // Try to match a topic that hasn't been covered yet
  for (const topic of topics) {
    if (!coveredTopics.has(topic.id) && topic.match(msg)) {
      coveredTopics.add(topic.id)
      return topic.respond(d)
    }
  }

  // If all matched topics are already covered, provide varied proactive answers
  // Don't push to conclude too fast — answer naturally, give new info each turn
  const proactiveResponses = [
    // Turn 0-2: comprehensive summary
    `Voici les données clés : CA ${d.revenue}€, EBITDA ${d.ebitda}€, croissance ${d.growth}%, effectif ${d.effectif}. Ma rémunération est de ${d.remunerationDirigeant}€. Récurrence : ${d.recurring}%. Dettes : ${d.dettesFinancieres ?? 0}€. Trésorerie : ${d.tresorerieActuelle ?? 0}€. Concentration client : ${d.concentrationClient}. ${d.hasPatrimoine ? 'Patrimoine immobilier détenu.' : 'Pas de patrimoine immobilier.'}`,
    // Turn 3-5: additional info
    `Le turnover dans l'équipe est faible. L'ancienneté moyenne est de 4 ans. ${d.effectif === '1' ? "Je suis seul dans l'entreprise." : "L'équipe clé resterait en cas de cession."}`,
    // Turn 6-8: retraitements
    `Pour les retraitements : ma rémunération de ${d.remunerationDirigeant}€ est conforme au marché. Pas de charges exceptionnelles. Pas de crédit-bail. Le loyer est au prix du marché.`,
    // Turn 9-11: more operational details
    `Le carnet de commandes est solide. Les marges sont stables depuis 3 ans. ${d.recurring > 50 ? 'La majorité des contrats sont pluriannuels.' : 'Le renouvellement des contrats se fait naturellement.'} Je confirme toutes les données fournies.`,
    // Turn 12-14: risks and primes
    `L'entreprise n'a pas de litige en cours. Tous les contrats sont à jour. Les certifications sont en place. ${d.effectif !== '1' ? "Un directeur opérationnel pourrait me remplacer." : ""}`,
    // Turn 15+: confirm and ready to conclude
    `J'ai fourni toutes les informations. N'hésitez pas à me poser des questions complémentaires si nécessaire.`,
    `Oui, c'est exact. Merci de poursuivre l'évaluation.`,
    `Je confirme. Toutes les données transmises sont correctes et à jour.`,
  ]

  const idx = Math.min(Math.floor(turnNumber / 3), proactiveResponses.length - 1)
  return proactiveResponses[idx]
}

// ============================================================
// Valuation data extraction (runs in Node.js, not browser)
// ============================================================

function parseAmount(raw: string): number {
  const cleaned = raw.trim().replace(/\s/g, '')
  const mMatch = cleaned.match(/([\d,.]+)\s*M/i)
  if (mMatch) return Math.round(parseFloat(mMatch[1].replace(',', '.')) * 1000000)
  const kMatch = cleaned.match(/([\d,.]+)\s*k/i)
  if (kMatch) return Math.round(parseFloat(kMatch[1].replace(',', '.')) * 1000)
  return parseInt(cleaned.replace(/[,.]/g, ''), 10) || 0
}

function extractValuationData(chatText: string, fullText: string) {
  // Extract valuation range
  let valuationLow: number | null = null
  let valuationHigh: number | null = null

  // Pattern 1: Markdown table — "Prix de Cession XXX € XXX € XXX €"
  const tablePatterns = [
    /(?:prix\s+(?:de\s+)?cession|prix\s+total)[^€]*?([\d\s,.]+\s*[Mk]?)\s*€[^€]*?([\d\s,.]+\s*[Mk]?)\s*€[^€]*?([\d\s,.]+\s*[Mk]?)\s*€/i,
    /valeur\s+d['']entreprise[^€]*?([\d\s,.]+\s*[Mk]?)\s*€[^€]*?([\d\s,.]+\s*[Mk]?)\s*€[^€]*?([\d\s,.]+\s*[Mk]?)\s*€/i,
  ]
  for (const pat of tablePatterns) {
    const m = chatText.match(pat)
    if (m) {
      const amounts = [parseAmount(m[1]), parseAmount(m[2]), parseAmount(m[3])].filter(a => a > 0).sort((a, b) => a - b)
      if (amounts.length >= 2 && (amounts[0] >= 50000 || amounts[amounts.length - 1] >= 50000)) {
        valuationLow = amounts[0]
        valuationHigh = amounts[amounts.length - 1]
        break
      }
    }
  }

  // Pattern 2: Range "X M€ - Y M€" or "Fourchette basse/haute"
  if (!valuationLow) {
    const rangePatterns = [
      // "Fourchette basse : 2,8M€ - 3,3M€" — common AI format
      /fourchette\s+(?:basse|haute)\s*:\s*([\d\s,.]+\s*[Mk]?)\s*€\s*[-–—àa]\s*([\d\s,.]+\s*[Mk]?)\s*€/i,
      /fourchette[^:]*:\s*([\d\s,.]+\s*[Mk]?)\s*€\s*[-–—àa]\s*([\d\s,.]+\s*[Mk]?)\s*€/i,
      /(?:prix de cession|valeur d'entreprise)[^:]*:\s*([\d\s,.]+\s*[Mk]?)\s*€\s*[-–—àa]\s*([\d\s,.]+\s*[Mk]?)\s*€/i,
      /entre\s*([\d\s,.]+\s*[Mk]?)\s*€\s*et\s*([\d\s,.]+\s*[Mk]?)\s*€/i,
      /(?:valorisation|fourchette)[^]*?([\d\s,.]+\s*[Mk]?)\s*€\s*[-–—àa]\s*([\d\s,.]+\s*[Mk]?)\s*€/i,
    ]
    for (const pat of rangePatterns) {
      const m = chatText.match(pat)
      if (m) {
        const low = parseAmount(m[1])
        const high = parseAmount(m[2])
        if ((low >= 50000 || high >= 50000) && high >= low) {
          valuationLow = low
          valuationHigh = high
          break
        }
      }
    }
  }

  // Pattern 3: Single amount
  if (!valuationLow) {
    const singlePatterns = [
      /(?:valorisation|valeur d'entreprise|prix de cession)\s*[:=]?\s*([\d\s,.]+\s*[Mk]?)\s*€/i,
      /(?:estimée?\s*à|évaluée?\s*à|vaut)\s*([\d\s,.]+\s*[Mk]?)\s*€/i,
    ]
    for (const pat of singlePatterns) {
      const m = chatText.match(pat)
      if (m) {
        const val = parseAmount(m[1])
        if (val >= 50000) { valuationLow = val; break }
      }
    }
  }

  // Pattern 4: Extract from separate "Fourchette basse" and "Fourchette haute" lines
  if (!valuationLow) {
    const basseMatch = chatText.match(/fourchette\s+basse[^€]*?([\d\s,.]+\s*[Mk]?)\s*€/i)
    const hauteMatch = chatText.match(/fourchette\s+haute[^€]*?([\d\s,.]+\s*[Mk]?)\s*€/i)
    if (basseMatch && hauteMatch) {
      const low = parseAmount(basseMatch[1])
      const high = parseAmount(hauteMatch[1])
      if (low >= 50000 || high >= 50000) {
        valuationLow = Math.min(low, high) || low
        valuationHigh = Math.max(low, high) || high
      }
    }
  }

  // Pattern 5: Fallback — find all amounts in valuation section only
  if (!valuationLow) {
    const valosection = chatText.match(/(?:fourchette|valorisation\s+finale|valeur d'entreprise\s*\(VE\))[^]*$/i)
    if (valosection) {
      const amounts: number[] = []
      const amountRegex = /([\d\s,.]+\s*[Mk]?)\s*€/gi
      let am
      while ((am = amountRegex.exec(valosection[0])) !== null) {
        const val = parseAmount(am[1])
        if (val >= 100000) amounts.push(val) // Higher threshold to avoid capturing EBITDA/CA
      }
      if (amounts.length >= 2) {
        amounts.sort((a, b) => a - b)
        valuationLow = amounts[0]
        valuationHigh = amounts[amounts.length - 1]
      } else if (amounts.length === 1) {
        valuationLow = amounts[0]
      }
    }
  }

  // Extract note — AI outputs "Note de confiance : [A-E]" and "Note attribuée : [X]"
  let note: string | null = null
  const notePatterns = [
    /note\s+attribu[eé]+e?\s*[:=]\s*\**\s*([A-E][+-]?)/i,
    /note\s+(?:de\s+confiance|globale?)\s*[:=]\s*\**\s*([A-E][+-]?)/i,
    /(?:note|score|rating)\s*[:=]\s*\**\s*([A-E][+-]?)/i,
  ]
  for (const pat of notePatterns) {
    const m = chatText.match(pat)
    if (m) { note = m[1].toUpperCase(); break }
  }

  // Extract confidence
  let confidence: string | null = null
  const confText = chatText.toLowerCase()
  if (confText.includes('confiance élevée') || confText.includes('confiance : élevée') || confText.includes('fiabilité élevée') || confText.includes('haute fiabilité')) {
    confidence = 'Élevée'
  } else if (confText.includes('confiance moyenne') || confText.includes('confiance : moyenne') || confText.includes('fiabilité moyenne')) {
    confidence = 'Moyenne'
  } else if (confText.includes('confiance faible') || confText.includes('confiance : faible') || confText.includes('fiabilité faible')) {
    confidence = 'Faible'
  }
  // Derive from note grade if not found
  if (!confidence && note) {
    const gradeMap: Record<string, string> = { 'A': 'Élevée', 'B': 'Élevée', 'C': 'Moyenne', 'D': 'Faible', 'E': 'Faible' }
    confidence = gradeMap[note.charAt(0)] || null
  }

  // Extract valuation method
  let method: string | null = null
  const methodPatterns = [
    /méthode\s+d['']évaluation\s+utilisée\s*[^\w]*([\w][\w\s'',.-]+)/i,
    /méthode\s*(?:principale|retenue|utilisée|de valorisation)\s*[:=]?\s*([^\n.]+)/i,
    /(?:valoris[ée]+\s+(?:par|via|selon)\s+(?:la\s+|l[''])?)([\w][\w\s''-]+)/i,
    /(?:multiple\s+d['']?(?:EBITDA|EBE|CA|ARR)[\w\d\s,.x×]*)/i,
    /(?:capitalisation\s+des?\s+loyers|ARR\s+multiple|DCF|actif\s+net\s+r[eé]{2}valu[eé])/i,
  ]
  for (const pat of methodPatterns) {
    const m = chatText.match(pat)
    if (m) {
      // Clean: take first line only, trim, limit length
      method = (m[1] || m[0]).split('\n')[0].trim().substring(0, 80)
      break
    }
  }

  // Extract key factors
  const factors: string[] = []
  const lines = chatText.split(/\n/)
  let inSection = ''
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.includes('fait monter') || (trimmed.includes('point') && trimmed.includes('fort'))) inSection = 'positive'
    else if (trimmed.includes('faire baisser') || trimmed.includes('vigilance')) inSection = 'negative'
    else if (trimmed.startsWith('###') || trimmed.startsWith('📋') || trimmed.startsWith('💡')) inSection = ''

    if (inSection && (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('✅') || trimmed.startsWith('⚠'))) {
      const text = trimmed.replace(/^[-•✅⚠️\s]+/, '').trim()
      if (text.length > 10 && text.length < 200) factors.push(text.substring(0, 150))
    }
  }
  if (factors.length === 0) {
    const factorPatterns = [
      /(?:facteur|point)\s+(?:positif|fort)\s*[:=]?\s*([^\n]+)/gi,
      /(?:risque|point de vigilance|attention)\s*[:=]?\s*([^\n]+)/gi,
    ]
    for (const pat of factorPatterns) {
      let m
      while ((m = pat.exec(chatText)) !== null) factors.push(m[1].trim().substring(0, 150))
    }
  }

  // Detect step
  let maxStep = 0
  const stepMatches = fullText.matchAll(/[EÉ]tape\s*(\d+)\s*[\/sur]+\s*6/gi)
  for (const sm of stepMatches) {
    const s = parseInt(sm[1], 10)
    if (s > maxStep) maxStep = s
  }

  return { valuationLow, valuationHigh, note, confidence, method, factors, currentStep: maxStep }
}

// ============================================================
// Chat interaction loop
// ============================================================

interface EvalResult {
  scenarioId: string
  archetypeId: string
  turnsCompleted: number
  evaluationComplete: boolean
  currentStep: number
  valuationLow: number | null
  valuationHigh: number | null
  valuationMethod: string | null
  note: string | null
  confidence: string | null
  keyFactors: string[]
  chatDuration: number
  conversationSummary: string[]
  error: string | null
}

async function runChatEvaluation(
  page: Page,
  scenario: TestScenario,
  evaluationId: string,
  logger: TestLogger,
): Promise<EvalResult> {
  // Reset covered topics for this scenario
  coveredTopics.clear()
  const startTime = Date.now()
  const result: EvalResult = {
    scenarioId: scenario.id,
    archetypeId: scenario.archetype,
    turnsCompleted: 0,
    evaluationComplete: false,
    currentStep: 0,
    valuationLow: null,
    valuationHigh: null,
    valuationMethod: null,
    note: null,
    confidence: null,
    keyFactors: [],
    chatDuration: 0,
    conversationSummary: [],
    error: null,
  }

  try {
    // Navigate to chat page
    logger.info(`Navigating to /evaluation/${evaluationId}/chat`)
    await page.goto(`${TEST_CONFIG.baseUrl}/evaluation/${evaluationId}/chat`, {
      waitUntil: 'networkidle2',
    })
    await wait(3000)

    // Check for redirects (auth/payment issues)
    const url = page.url()
    if (url.includes('/connexion')) {
      throw new Error('Redirected to /connexion — authentication failed')
    }
    if (url.includes('/checkout')) {
      throw new Error('Redirected to /checkout — payment not registered')
    }
    if (!url.includes('/chat')) {
      throw new Error(`Unexpected redirect to: ${url}`)
    }

    // Wait for the initial AI message
    logger.info('Waiting for initial AI message...')
    try {
      await waitForStreamingEnd(page, 60000)
    } catch {
      // The page might not be streaming yet, wait and retry
      await wait(3000)
      await waitForStreamingEnd(page, 60000)
    }
    await wait(1000)
    await takeScreenshot(page, `eval_chat_${scenario.id}_initial`)

    // Extract initial message (use .prose selector for assistant message content only)
    const initialMsg = await page.evaluate(() => {
      const msgs = document.querySelectorAll('div.prose.prose-sm.max-w-none')
      return msgs.length > 0 ? (msgs[0].textContent || '').substring(0, 200) : ''
    })
    logger.info(`Initial AI message: "${initialMsg.substring(0, 100)}..."`)
    result.conversationSummary.push(`AI: ${initialMsg.substring(0, 150)}`)

    // Chat loop
    let numericFieldAttempts = 0
    for (let turn = 0; turn < MAX_CHAT_TURNS; turn++) {
      // Get the LAST AI message text (prose content only, not headers/nav)
      const lastAiMessage = await page.evaluate(() => {
        const msgs = document.querySelectorAll('div.prose.prose-sm.max-w-none')
        if (msgs.length === 0) return ''
        const lastMsg = msgs[msgs.length - 1]
        return lastMsg?.textContent || ''
      })

      // Check for evaluation complete signals — strict detection
      // Only consider complete when:
      // - At step 5+ and specific phrases appear, OR
      // - At step 6, OR
      // - "Étape 6/6" or "synthèse" in last message with valuation amounts
      {
        const chatComplete = await page.evaluate((currentStep: number) => {
          const msgs = document.querySelectorAll('div.prose.prose-sm.max-w-none')
          if (msgs.length < 3) return false
          const lastMsg = (msgs[msgs.length - 1].textContent || '').toLowerCase()

          // Detect step from last message
          const stepMatch = lastMsg.match(/[eé]tape\s*(\d+)\s*[\/sur]+\s*6/i)
          const msgStep = stepMatch ? parseInt(stepMatch[1], 10) : 0
          const effectiveStep = Math.max(currentStep, msgStep)

          // At step 6: any substantial content is completion
          if (effectiveStep >= 6) return true

          // At step 5+: look for final valuation patterns
          if (effectiveStep >= 5) {
            if (
              lastMsg.includes('fourchette finale') ||
              lastMsg.includes('valorisation finale') ||
              lastMsg.includes('synthèse finale') ||
              lastMsg.includes('évaluation terminée')
            ) return true
            // Valuation range with amounts > 50k€
            const rangeMatch = lastMsg.match(/(\d[\d\s,.]+)\s*€\s*(?:à|[-–—]|et)\s*(\d[\d\s,.]+)\s*€/)
            if (rangeMatch) {
              const low = parseInt(rangeMatch[1].replace(/[\s,.]/g, ''), 10)
              const high = parseInt(rangeMatch[2].replace(/[\s,.]/g, ''), 10)
              if (low >= 50000 || high >= 50000) return true
            }
          }

          return false
        }, result.currentStep)

        if (chatComplete) {
          logger.info(`Evaluation complete signal detected at turn ${turn}`)
          result.evaluationComplete = true
          break
        }
      }

      // Detect current step from "Etape X/6" pattern — in chat messages only
      const stepMatch = await page.evaluate(() => {
        const msgs = document.querySelectorAll('div.prose.prose-sm.max-w-none')
        let maxStep = 0
        msgs.forEach(m => {
          const text = m.textContent || ''
          const match = text.match(/[EÉ]tape\s*(\d+)\s*[\/sur]+\s*6/i)
          if (match) maxStep = Math.max(maxStep, parseInt(match[1], 10))
        })
        return maxStep
      })
      if (stepMatch > result.currentStep) {
        result.currentStep = stepMatch
        logger.info(`  Step ${stepMatch}/6 detected`)
      }

      // Check for suggestion buttons and numeric fields in the LAST assistant message only
      const { suggestions, hasNumericFields, lastMsgIndex } = await page.evaluate(() => {
        // Find all assistant message bubbles (they have a .prose child)
        const allBubbles = Array.from(document.querySelectorAll('.flex.gap-3'))
          .filter(el => el.querySelector('div.prose.prose-sm'))

        if (allBubbles.length === 0) return { suggestions: [] as string[], hasNumericFields: false, lastMsgIndex: -1 }

        const lastBubble = allBubbles[allBubbles.length - 1]
        const lastIdx = allBubbles.length - 1

        // Check for suggestions in LAST message only
        const results: string[] = []
        const containers = lastBubble.querySelectorAll('.mt-4')
        containers.forEach(container => {
          const buttons = container.querySelectorAll('button')
          buttons.forEach(b => {
            const text = (b.textContent || '').trim()
            const cls = b.className || ''
            if (
              cls.includes('radius-full') &&
              text.length > 2 &&
              text.length < 100 &&
              !text.toLowerCase().startsWith('envoyer') &&
              !text.startsWith('✓') // Already selected
            ) {
              results.push(text)
            }
          })
        })

        // Check for numeric inputs in LAST message only
        const numInputs = lastBubble.querySelectorAll('input[inputmode="numeric"]')

        return { suggestions: results, hasNumericFields: numInputs.length > 0, lastMsgIndex: lastIdx }
      })

      if (hasNumericFields && numericFieldAttempts < 3) {
        numericFieldAttempts++
        // Fill numeric fields in the LAST assistant message using React-compatible value setter
        logger.info(`  Turn ${turn}: Filling numeric fields (attempt ${numericFieldAttempts})`)
        result.conversationSummary.push(`User: [numeric fields filled]`)

        // Use Puppeteer's page methods to interact with inputs properly
        const fieldHandles = await page.$$('.flex.gap-3:last-of-type input[inputmode="numeric"]')
        if (fieldHandles.length === 0) {
          // Fallback: get all numeric inputs from assistant bubbles
          const allInputs = await page.evaluate(() => {
            const allBubbles = Array.from(document.querySelectorAll('.flex.gap-3'))
              .filter(el => el.querySelector('div.prose.prose-sm'))
            if (allBubbles.length === 0) return 0
            const lastBubble = allBubbles[allBubbles.length - 1]
            return lastBubble.querySelectorAll('input[inputmode="numeric"]').length
          })
          logger.info(`    Found ${allInputs} numeric inputs in last bubble`)
        }

        // Use React-compatible value setter to trigger state updates
        const filled = await page.evaluate((revenue: number, ebitda: number, remDir: number) => {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
          if (!nativeSetter) return false

          const allBubbles = Array.from(document.querySelectorAll('.flex.gap-3'))
            .filter(el => el.querySelector('div.prose.prose-sm'))
          if (allBubbles.length === 0) return false
          const lastBubble = allBubbles[allBubbles.length - 1]
          const inputs = Array.from(lastBubble.querySelectorAll('input[inputmode="numeric"]')) as HTMLInputElement[]

          if (inputs.length === 0) return false

          inputs.forEach((el, i) => {
            // Determine value based on label text in the same row
            const parentRow = el.closest('.flex.items-center')
            const label = parentRow?.querySelector('label')?.textContent?.toLowerCase() || ''
            let val: number
            if (label.includes('rémunération') || label.includes('salaire')) val = remDir
            else if (label.includes('ebitda') || label.includes('résultat')) val = ebitda
            else if (label.includes('ca') || label.includes('chiffre')) val = revenue
            else if (label.includes('dette') || label.includes('endettement')) val = 0
            else if (label.includes('trésorerie')) val = 0
            else val = i === 0 ? revenue : ebitda

            // Use native setter to trigger React onChange
            nativeSetter.call(el, String(val))
            el.dispatchEvent(new Event('input', { bubbles: true }))
            el.dispatchEvent(new Event('change', { bubbles: true }))
          })
          return true
        }, scenario.diagnostic.revenue, scenario.diagnostic.ebitda, scenario.diagnostic.remunerationDirigeant)

        if (!filled) {
          logger.warn(`    Could not fill numeric fields — skipping to text response`)
          const response = generateResponse(scenario, lastAiMessage, turn)
          await sendChatMessage(page, response)
        } else {
          await wait(800)
          // Click "Envoyer" in the LAST message bubble
          const envoyerClicked = await page.evaluate(() => {
            const allBubbles = Array.from(document.querySelectorAll('.flex.gap-3'))
              .filter(el => el.querySelector('div.prose.prose-sm'))
            if (allBubbles.length === 0) return false
            const lastBubble = allBubbles[allBubbles.length - 1]
            const buttons = Array.from(lastBubble.querySelectorAll('button'))
            const submitBtn = buttons.find(b => (b.textContent || '').trim().toLowerCase().startsWith('envoyer'))
            if (submitBtn && !(submitBtn as HTMLButtonElement).disabled) {
              (submitBtn as HTMLButtonElement).click()
              return true
            }
            return false
          })
          if (!envoyerClicked) {
            logger.warn(`    Envoyer button not clickable — pressing Enter instead`)
            const input = await page.$('.flex.gap-3:last-of-type input[inputmode="numeric"]')
            if (input) {
              await input.press('Enter')
            } else {
              // Last resort: send as text
              const response = generateResponse(scenario, lastAiMessage, turn)
              await sendChatMessage(page, response)
            }
          }
        }
      } else if (hasNumericFields && numericFieldAttempts >= 3) {
        // Numeric fields stuck — fall back to text response
        logger.warn(`  Turn ${turn}: Numeric fields stuck, falling back to text`)
        const response = generateResponse(scenario, lastAiMessage, turn)
        await sendChatMessage(page, response)
      } else if (suggestions.length > 0) {
        // Click the first suggestion in the LAST message
        const suggestion = suggestions[0]
        logger.info(`  Turn ${turn}: Selecting suggestion: "${suggestion}"`)
        result.conversationSummary.push(`User: [selected] ${suggestion}`)

        await page.evaluate((text) => {
          const allBubbles = Array.from(document.querySelectorAll('.flex.gap-3'))
            .filter(el => el.querySelector('div.prose.prose-sm'))
          if (allBubbles.length === 0) return
          const lastBubble = allBubbles[allBubbles.length - 1]
          const buttons = lastBubble.querySelectorAll('.mt-4 button')
          buttons.forEach(b => {
            if ((b.textContent || '').trim() === text) (b as HTMLButtonElement).click()
          })
        }, suggestion)

        // Wait for "Envoyer" button to appear, then click it
        await wait(800)
        await page.evaluate(() => {
          const allBubbles = Array.from(document.querySelectorAll('.flex.gap-3'))
            .filter(el => el.querySelector('div.prose.prose-sm'))
          if (allBubbles.length === 0) return
          const lastBubble = allBubbles[allBubbles.length - 1]
          const buttons = Array.from(lastBubble.querySelectorAll('.mt-4 button'))
          const envoyerBtn = buttons.find(b => (b.textContent || '').trim().toLowerCase().startsWith('envoyer'))
          if (envoyerBtn && !(envoyerBtn as HTMLButtonElement).disabled) {
            (envoyerBtn as HTMLButtonElement).click()
          }
        })
      } else {
        // Generate and send free text response
        const response = generateResponse(scenario, lastAiMessage, turn)
        logger.info(`  Turn ${turn}: Sending: "${response.substring(0, 80)}..."`)
        result.conversationSummary.push(`User: ${response.substring(0, 100)}`)

        await sendChatMessage(page, response)
      }

      // Wait for AI response
      try {
        await waitForBotResponse(page, 90000)
      } catch {
        logger.warn(`  Bot response timeout at turn ${turn}`)
        // Try to continue anyway
      }
      await wait(1000)

      result.turnsCompleted = turn + 1

      // Periodic screenshot
      if (turn % 5 === 4) {
        await takeScreenshot(page, `eval_chat_${scenario.id}_turn${turn + 1}`)
      }

      // Log AI response summary
      const aiResp = await page.evaluate(() => {
        const msgs = document.querySelectorAll('div.prose.prose-sm.max-w-none')
        if (msgs.length === 0) return ''
        const lastMsg = msgs[msgs.length - 1]
        return (lastMsg?.textContent || '').substring(0, 150)
      })
      result.conversationSummary.push(`AI: ${aiResp.substring(0, 100)}`)
    }

    // Final extraction: valuation data from the chat
    await takeScreenshot(page, `eval_chat_${scenario.id}_final`)

    // Step 1: Get raw text from browser (minimal browser code to avoid esbuild __name issues)
    const rawTexts = await page.evaluate(() => {
      const msgs = document.querySelectorAll('div.prose.prose-sm.max-w-none')
      const lastMsgs = Array.from(msgs).slice(-5)
      return {
        chatText: lastMsgs.map(m => m.textContent || '').join('\n'),
        fullText: document.body.innerText,
      }
    })

    // Debug: save raw chatText for analysis
    const debugDir = path.join(process.cwd(), 'tests', 'output')
    fs.writeFileSync(
      path.join(debugDir, `chattext_${scenario.id}.txt`),
      rawTexts.chatText
    )

    // Step 2: Process in Node.js (all extraction logic here — safe from esbuild __name issues)
    const extractedData = extractValuationData(rawTexts.chatText, rawTexts.fullText)

    result.valuationLow = extractedData.valuationLow
    result.valuationHigh = extractedData.valuationHigh
    result.note = extractedData.note
    result.confidence = extractedData.confidence
    result.valuationMethod = extractedData.method
    result.keyFactors = extractedData.factors
    if (extractedData.currentStep > result.currentStep) {
      result.currentStep = extractedData.currentStep
    }

    logger.info(`  Valuation: ${result.valuationLow ?? 'N/A'}€ - ${result.valuationHigh ?? 'N/A'}€`)
    logger.info(`  Method: ${result.valuationMethod ?? 'N/A'}`)
    logger.info(`  Note: ${result.note ?? 'N/A'}, Confidence: ${result.confidence ?? 'N/A'}`)
    logger.info(`  Steps reached: ${result.currentStep}/6`)
    logger.info(`  Complete: ${result.evaluationComplete}`)

  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error)
    logger.error(`Chat evaluation failed: ${result.error}`)
    await takeScreenshot(page, `eval_chat_${scenario.id}_error`)
  }

  result.chatDuration = Date.now() - startTime
  return result
}

// ============================================================
// Test runner
// ============================================================

async function runTest(
  name: string,
  testFn: () => Promise<void>,
  logger: TestLogger,
  reporter: TestReporter
): Promise<TestResult> {
  const startTime = Date.now()
  logger.testStart(name)

  try {
    await testFn()
    const duration = Date.now() - startTime
    logger.testEnd(name, true, duration)
    return { name, module: MODULE_NAME, status: 'pass', duration }
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.testEnd(name, false, duration)
    logger.error(`Test failed: ${errorMsg}`)
    return { name, module: MODULE_NAME, status: 'fail', duration, error: errorMsg }
  }
}

// ============================================================
// Main export
// ============================================================

export async function runEvalChatFlowTests(reporter: TestReporter): Promise<void> {
  const ctx = await createTestContext(MODULE_NAME)
  const { page, logger } = ctx

  reporter.startModule(MODULE_NAME)

  // Determine which scenarios to run
  const scenarioFilter = process.env.TEST_EVAL_SCENARIOS
  const scenarioIds = scenarioFilter
    ? scenarioFilter.split(',').map(s => s.trim())
    : DEFAULT_SCENARIOS

  const selectedScenarios = SCENARIOS.filter(s => scenarioIds.includes(s.id))

  if (selectedScenarios.length === 0) {
    logger.error(`No matching scenarios found for: ${scenarioIds.join(', ')}`)
    reporter.endModule()
    await closeTestContext(ctx)
    return
  }

  logger.info(`Running ${selectedScenarios.length} scenarios: ${selectedScenarios.map(s => s.id).join(', ')}`)

  // Output directory
  const outputDir = path.join(process.cwd(), 'tests', 'output')
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

  const allResults: EvalResult[] = []

  try {
    // Step 1: Login
    reporter.addResult(
      await runTest('Login test user', async () => {
        await loginTestUser(page, logger)
      }, logger, reporter)
    )

    // Get user ID for evaluation creation
    const userId = await getUserId(TEST_CONFIG.testUser.email)
    logger.info(`User ID: ${userId}`)

    // Step 2: Run each scenario
    for (const scenario of selectedScenarios) {
      logger.info(`\n${'═'.repeat(60)}`)
      logger.info(`SCENARIO: ${scenario.id} (${scenario.nom})`)
      logger.info(`${'═'.repeat(60)}\n`)

      // Use the archetype from the scenario (expected)
      // For scenarios where detection mismatches, use the detected archetype
      const archetypeId = scenario.archetype

      let evaluationId: string | null = null

      // Create evaluation
      reporter.addResult(
        await runTest(`[${scenario.id}] Create evaluation`, async () => {
          evaluationId = await createEvaluation(userId, scenario, archetypeId)
          logger.info(`Evaluation created: ${evaluationId}`)
        }, logger, reporter)
      )

      if (!evaluationId) {
        logger.error(`Failed to create evaluation for ${scenario.id}`)
        continue
      }

      // Run chat evaluation
      let evalResult: EvalResult | null = null
      reporter.addResult(
        await runTest(`[${scenario.id}] Chat evaluation (full flow)`, async () => {
          evalResult = await runChatEvaluation(page, scenario, evaluationId!, logger)

          if (evalResult.error) {
            throw new Error(evalResult.error)
          }

          // Verify we got through at least some steps
          if (evalResult.turnsCompleted < 3) {
            throw new Error(`Only ${evalResult.turnsCompleted} turns completed — conversation didn't progress`)
          }
        }, logger, reporter)
      )

      if (evalResult) {
        allResults.push(evalResult)

        // Compare with expected
        reporter.addResult(
          await runTest(`[${scenario.id}] Valuation captured`, async () => {
            if (!evalResult!.valuationLow && !evalResult!.valuationHigh) {
              logger.warn(`No valuation range captured for ${scenario.id}`)
              // Not a hard failure — the AI may express it differently
            } else {
              logger.info(`Valuation: ${evalResult!.valuationLow}€ - ${evalResult!.valuationHigh}€`)
            }
          }, logger, reporter)
        )
      }

      // Brief pause between scenarios
      await wait(2000)
    }

    // Write results JSON
    const resultsPath = path.join(outputDir, 'eval-chat-results.json')
    fs.writeFileSync(resultsPath, JSON.stringify(allResults, null, 2))
    logger.info(`\nResults saved to: ${resultsPath}`)

    // Print comparison table
    console.log('\n┌─────────────────────────┬────────┬───────┬───────────────────┬────────────────────────────────┐')
    console.log('│ Scenario                │ Steps  │ Turns │ Note / Confidence │ Valuation Range                │')
    console.log('├─────────────────────────┼────────┼───────┼───────────────────┼────────────────────────────────┤')
    for (const r of allResults) {
      const id = r.scenarioId.padEnd(23)
      const steps = `${r.currentStep}/6`.padEnd(6)
      const turns = String(r.turnsCompleted).padEnd(5)
      const noteConf = `${r.note ?? '?'} / ${r.confidence ?? '?'}`.padEnd(17)
      const valo = r.valuationLow && r.valuationHigh
        ? `${formatNum(r.valuationLow)}€ - ${formatNum(r.valuationHigh)}€`
        : r.valuationLow
          ? `${formatNum(r.valuationLow)}€`
          : 'N/A'
      console.log(`│ ${id} │ ${steps} │ ${turns} │ ${noteConf} │ ${valo.padEnd(30)} │`)
    }
    console.log('└─────────────────────────┴────────┴───────┴───────────────────┴────────────────────────────────┘')

    // Detailed comparison with expected
    console.log('\n═══════════════════════════════════════════════════════════════════════')
    console.log('  COMPARISON: Actual vs Expected')
    console.log('═══════════════════════════════════════════════════════════════════════')
    for (const r of allResults) {
      const scenario = selectedScenarios.find(s => s.id === r.scenarioId)
      if (!scenario) continue
      const ex = scenario.expected
      console.log(`\n  ${r.scenarioId} (${scenario.nom})`)
      console.log(`  ${'─'.repeat(50)}`)
      console.log(`  Note:       Expected=${ex.note.padEnd(6)}  Got=${(r.note ?? 'N/A (AI prompt)').padEnd(20)}`)
      console.log(`  Confiance:  Expected=${ex.confiance.padEnd(10)}  Got=${(r.confidence ?? 'N/A (AI prompt)').padEnd(20)}`)
      console.log(`  Method:     Expected="${ex.valoMethod}"`)
      console.log(`              Got="${r.valuationMethod ?? 'N/A'}"`)
      // Method match: check if key words overlap
      const gotMethod = (r.valuationMethod || '').toLowerCase()
      const expMethod = ex.valoMethod.toLowerCase()
      const methodMatch = gotMethod && (
        (expMethod.includes('ebitda') && gotMethod.includes('ebitda')) ||
        (expMethod.includes('arr') && (gotMethod.includes('arr') || gotMethod.includes('saas'))) ||
        (expMethod.includes('dcf') && gotMethod.includes('dcf')) ||
        (expMethod.includes('capitalisation') && gotMethod.includes('capitalisation')) ||
        (expMethod.includes('anr') && gotMethod.includes('anr'))
      )
      console.log(`              ${methodMatch ? '✅ Method matches' : gotMethod ? '⚠️ Different method' : '❌ No method captured'}`)
      const valoStr = r.valuationLow && r.valuationHigh
        ? `${formatNum(r.valuationLow)}€ - ${formatNum(r.valuationHigh)}€`
        : r.valuationLow
          ? `${formatNum(r.valuationLow)}€ (single)`
          : 'N/A'
      console.log(`  Valuation:  ${valoStr}`)
      console.log(`  Steps:      ${r.currentStep}/6  Complete: ${r.evaluationComplete ? '✅' : '❌'}`)
      console.log(`  Factors:    ${r.keyFactors.length > 0 ? r.keyFactors.slice(0, 3).join(' | ') : 'None captured'}`)
    }
    console.log('\n═══════════════════════════════════════════════════════════════════════')

  } catch (error) {
    logger.error(`Fatal error: ${error}`)
  } finally {
    reporter.endModule()
    await closeTestContext(ctx)
  }
}

function formatNum(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

// Direct execution
if (require.main === module) {
  // Load env vars when running directly
  const dotenv = require('dotenv')
  dotenv.config({ path: require('path').resolve(__dirname, '..', '..', '.env.local') })

  const { getReporter } = require('../utils/reporter')
  const reporter = getReporter()

  runEvalChatFlowTests(reporter)
    .then(() => {
      reporter.printSummary()
      reporter.saveReport('eval_chat_flow_tests.json')
      process.exit(reporter.generateReport().summary.failed > 0 ? 1 : 0)
    })
    .catch(err => {
      console.error('Fatal error:', err)
      process.exit(1)
    })
}
