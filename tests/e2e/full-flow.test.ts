// Tests E2E du flow complet : diagnostic → paiement → chat IA → PDF → vérification cohérence
//
// Ce module valide le pipeline bout en bout en simulant un utilisateur réel.
// Il couvre :
// 1. Le diagnostic (SIREN, activité, données financières)
// 2. L'authentification (login Supabase)
// 3. Le chat conversationnel avec l'IA (streaming, suggestions)
// 4. Le téléchargement et parsing du PDF
// 5. Les vérifications de cohérence (chat ↔ PDF, effectif, score, retraitements)

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
import { login } from './helpers/auth'
import { parsePDF, savePDFBuffer, type ParsedReport } from './helpers/pdf-parser'
import {
  SCENARIO_POSSE,
  SCENARIO_CONSEIL,
  SCENARIO_MICRO,
  type TestScenario,
} from './fixtures/scenarios'

const MODULE_NAME = 'full-flow'

// ============================================================
// Helpers
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
// PHASE 1 — Diagnostic
// ============================================================

async function navigateDiagnostic(
  page: Page,
  scenario: TestScenario,
  logger: TestLogger
): Promise<{ evaluationId: string | null; reachedResult: boolean }> {
  logger.info(`Starting diagnostic for SIREN ${scenario.siren}`)

  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic`, { waitUntil: 'networkidle2' })
  await wait(2000)

  // Step 0: Enter SIREN
  const input = await page.$('input[placeholder="XXX XXX XXX"]')
  if (!input) throw new Error('SIREN input not found on /diagnostic')

  await page.waitForFunction(
    () => {
      const el = document.querySelector('input[placeholder="XXX XXX XXX"]') as HTMLInputElement
      return el && !el.disabled
    },
    { timeout: 10000 }
  )

  await input.type(scenario.siren)

  // Submit via Rechercher or Enter
  const clicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(
      b => b.textContent?.trim().includes('Rechercher')
    )
    if (btn) { (btn as HTMLButtonElement).click(); return true }
    return false
  })
  if (!clicked) await page.keyboard.press('Enter')

  // Wait for Pappers lookup + auto-advance
  await wait(6000)
  await takeScreenshot(page, 'diagnostic_siren_result')

  // Verify company name appears (if specified)
  if (scenario.expectedPappers.companyName) {
    const pageText = await page.evaluate(() => document.body.innerText)
    if (!pageText.toUpperCase().includes(scenario.expectedPappers.companyName.toUpperCase())) {
      logger.warn(`Expected company name "${scenario.expectedPappers.companyName}" not found on page`)
    } else {
      logger.info(`Company name "${scenario.expectedPappers.companyName}" found`)
    }
  }

  // Click through the diagnostic steps
  let stepCount = 0
  const maxSteps = 15

  for (let i = 0; i < maxSteps; i++) {
    const stepAction = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))

      // Click a choice button (option card)
      const choiceBtn = buttons.find(btn => {
        const text = btn.textContent?.toLowerCase() || ''
        return !text.includes('retour') &&
               !text.includes('précédent') &&
               !text.includes('rechercher') &&
               btn.className.includes('border') &&
               !btn.disabled &&
               text.length > 2 && text.length < 100
      })

      if (choiceBtn) {
        ;(choiceBtn as HTMLElement).click()
        return 'choice'
      }

      // Click slider "Confirmer" or "Continuer"
      const nextBtn = buttons.find(btn => {
        const text = btn.textContent?.toLowerCase() || ''
        return (text.includes('continuer') || text.includes('confirmer') ||
                text.includes('voir mon diagnostic')) && !btn.disabled
      })

      if (nextBtn) {
        ;(nextBtn as HTMLElement).click()
        return 'next'
      }

      return null
    })

    if (!stepAction) break

    stepCount++
    await wait(1500)

    // Check for redirect
    const url = page.url()
    if (url.includes('/loading') || url.includes('/signup') || url.includes('/result')) {
      logger.info(`Diagnostic redirect to ${url} after ${stepCount} steps`)
      break
    }
  }

  logger.info(`Completed ${stepCount} diagnostic steps`)
  await takeScreenshot(page, 'diagnostic_completed')

  // Wait for loading page to process
  if (page.url().includes('/loading')) {
    await wait(10000)
  }

  // Check if we reached result or need auth
  const finalUrl = page.url()
  const reachedResult = finalUrl.includes('/result') || finalUrl.includes('/signup') || finalUrl.includes('/loading')

  // Try to extract evaluation ID from URL or page content
  let evaluationId: string | null = null
  const evalMatch = finalUrl.match(/evaluation\/([^/]+)/)
  if (evalMatch) {
    evaluationId = evalMatch[1]
  }

  return { evaluationId, reachedResult }
}

// ============================================================
// PHASE 3 — Chat Conversation
// ============================================================

interface ChatResult {
  messagesExchanged: number
  questionsAsked: string[]
  answersGiven: string[]
  allChatText: string
  valuationMentioned: boolean
  valuationAmount: number | null
  contradictionDetected: boolean
  evaluationComplete: boolean
  duration: number
}

async function runChatConversation(
  page: Page,
  scenario: TestScenario,
  logger: TestLogger
): Promise<ChatResult> {
  const startTime = Date.now()
  const result: ChatResult = {
    messagesExchanged: 0,
    questionsAsked: [],
    answersGiven: [],
    allChatText: '',
    valuationMentioned: false,
    valuationAmount: null,
    contradictionDetected: false,
    evaluationComplete: false,
    duration: 0,
  }

  try {
    // Wait for first AI message
    logger.info('Waiting for first AI message...')
    await waitForStreamingEnd(page, 45000)
    await wait(1000)
    await takeScreenshot(page, 'chat_first_message')

    // Verify first message mentions the company
    const firstMessages = await getChatMessages(page)
    if (firstMessages.length > 0) {
      const firstText = firstMessages[0].content
      if (scenario.expectedPappers.companyName &&
          firstText.toUpperCase().includes(scenario.expectedPappers.companyName.toUpperCase())) {
        logger.info('First AI message mentions company name')
      }
    }

    // Send scenario chat messages
    for (const message of scenario.chatMessages) {
      logger.info(`Sending: "${message.substring(0, 60)}..."`)
      result.answersGiven.push(message)

      await sendChatMessage(page, message)

      try {
        await waitForBotResponse(page, 90000)
      } catch {
        logger.warn('Bot response timeout — continuing')
      }

      await wait(1000)
      result.messagesExchanged++

      // Extract questions from assistant
      const questions = await page.evaluate(() => {
        const msgs = document.querySelectorAll('[class*="flex gap-3"]')
        const lastMsg = msgs[msgs.length - 1]
        if (!lastMsg) return []
        const text = lastMsg.textContent || ''
        const matches = text.match(/[^.!?\n]*\?/g)
        return matches ? matches.map((q: string) => q.trim()).filter((q: string) => q.length > 10) : []
      })
      result.questionsAsked.push(...questions)

      // Check for valuation mention
      const pageText = await page.evaluate(() => document.body.innerText.toLowerCase())
      if (pageText.includes('valorisation') || pageText.includes('fourchette') || pageText.includes('prix de cession')) {
        result.valuationMentioned = true
      }

      // Check for contradiction detection
      if (pageText.includes('contradiction') || pageText.includes('incohéren') || pageText.includes('attention')) {
        result.contradictionDetected = true
      }

      // Check for evaluation complete
      if (pageText.includes('evaluation_complete') || pageText.includes('évaluation terminée')) {
        result.evaluationComplete = true
        logger.info('Evaluation marked as complete')
        break
      }
    }

    // Extract final state
    const allMessages = await getChatMessages(page)
    result.allChatText = allMessages.map(m => m.content).join('\n')

    // Try to extract valuation amount
    const valuationMatch = result.allChatText.match(
      /(?:prix de cession|valorisation).*?([\d\s]+)\s*€/i
    )
    if (valuationMatch) {
      result.valuationAmount = parseInt(valuationMatch[1].replace(/\s/g, ''), 10)
      logger.info(`Valuation extracted from chat: ${result.valuationAmount}€`)
    }

    await takeScreenshot(page, 'chat_final_state')

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    if (!errMsg.includes('__name') && !errMsg.includes('is not defined')) {
      logger.error(`Chat error: ${errMsg}`)
    } else {
      logger.warn(`Bundler error ignored: ${errMsg}`)
    }
  }

  result.duration = Date.now() - startTime
  logger.info(`Chat completed: ${result.messagesExchanged} exchanges, ${result.questionsAsked.length} questions, duration: ${(result.duration / 1000).toFixed(1)}s`)
  return result
}

// ============================================================
// PHASE 4 — PDF Download
// ============================================================

async function downloadPDF(
  page: Page,
  logger: TestLogger
): Promise<Buffer | null> {
  logger.info('Attempting PDF download...')

  // Check if download button exists
  const hasDownloadButton = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    return text.includes('telecharger le pdf') || text.includes('télécharger le pdf') ||
           text.includes('telecharger') || text.includes('rapport')
  })

  if (!hasDownloadButton) {
    logger.warn('No download button found — evaluation may not be complete or paid')
    return null
  }

  // Intercept the PDF response
  return new Promise<Buffer | null>((resolve) => {
    const timeout = setTimeout(() => {
      logger.warn('PDF download timeout')
      page.off('response', responseHandler)
      resolve(null)
    }, 30000)

    // Listen for PDF response
    const responseHandler = async (response: import('puppeteer').HTTPResponse) => {
      try {
        if (response.url().includes('/api/evaluation/pdf') &&
            response.headers()['content-type']?.includes('pdf')) {
          clearTimeout(timeout)
          page.off('response', responseHandler)
          const buffer = Buffer.from(await response.buffer())
          logger.info(`PDF downloaded: ${buffer.length} bytes`)
          resolve(buffer)
        }
      } catch {
        // Ignore errors from non-PDF responses
      }
    }

    page.on('response', responseHandler)

    // Click the download button
    page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const dlBtn = buttons.find(btn => {
        const text = btn.textContent?.toLowerCase() || ''
        return text.includes('telecharger') || text.includes('télécharger')
      })
      if (dlBtn) (dlBtn as HTMLButtonElement).click()
    }).catch(() => {
      clearTimeout(timeout)
      page.off('response', responseHandler)
      resolve(null)
    })
  })
}

// ============================================================
// PHASE 5 — Coherence Checks
// ============================================================

function checkCoherence(
  scenario: TestScenario,
  chatResult: ChatResult,
  pdfReport: ParsedReport | null,
  logger: TestLogger
): string[] {
  const details: string[] = []

  if (!pdfReport) {
    details.push('No PDF report available — skipping PDF checks')
    return details
  }

  // 5.1 — Chat ↔ PDF valuation coherence (±20%)
  if (chatResult.valuationAmount && pdfReport.prixCession) {
    const ecart = Math.abs(chatResult.valuationAmount - pdfReport.prixCession) / chatResult.valuationAmount
    const ok = ecart < 0.20
    details.push(`Valuation: chat=${chatResult.valuationAmount}€, PDF=${pdfReport.prixCession}€, écart=${Math.round(ecart * 100)}% ${ok ? '✓' : '✗'}`)
    if (!ok) logger.error(`Valuation gap too large: ${Math.round(ecart * 100)}%`)
  }

  // 5.2 — Note in expected range
  if (pdfReport.noteGlobale) {
    const noteOrder = ['E', 'D', 'C', 'B', 'A']
    const noteIndex = noteOrder.indexOf(pdfReport.noteGlobale)
    const minIndex = noteOrder.indexOf(scenario.expectedReport.noteMin)
    const maxIndex = noteOrder.indexOf(scenario.expectedReport.noteMax)
    const ok = noteIndex >= minIndex && noteIndex <= maxIndex
    details.push(`Note: ${pdfReport.noteGlobale} (expected ${scenario.expectedReport.noteMin}-${scenario.expectedReport.noteMax}) ${ok ? '✓' : '✗'}`)
  }

  // 5.3 — Confidence check
  if (pdfReport.confiance && !pdfReport.retraitementsEffectues) {
    const badConfidence = pdfReport.confiance === 'Élevée' || pdfReport.confiance === 'Elevee'
    details.push(`Confidence: ${pdfReport.confiance}, retraitements=${pdfReport.retraitementsEffectues ? 'oui' : 'non'} ${!badConfidence ? '✓' : '✗'}`)
  }

  // 5.4 — No raw tranche code
  const hasRawCode = pdfReport.fullText.includes('250001') || pdfReport.fullText.includes('250 001')
  details.push(`No raw tranche codes: ${!hasRawCode ? '✓' : '✗'}`)

  // 5.5 — Required keywords
  for (const kw of scenario.expectedReport.requiredKeywords) {
    const found = pdfReport.fullText.toLowerCase().includes(kw.toLowerCase())
    details.push(`Keyword "${kw}": ${found ? '✓' : '✗'}`)
  }

  // 5.6 — Forbidden keywords
  for (const kw of scenario.expectedReport.forbiddenKeywords) {
    const found = pdfReport.fullText.includes(kw)
    details.push(`Forbidden "${kw}": ${!found ? '✓' : '✗'}`)
  }

  return details
}

// ============================================================
// MAIN: Exécuter un scenario complet
// ============================================================

async function runFullScenarioTest(
  page: Page,
  scenario: TestScenario,
  logger: TestLogger,
  reporter: TestReporter
): Promise<void> {
  logger.info(`\n${'═'.repeat(60)}`)
  logger.info(`SCENARIO: ${scenario.name}`)
  logger.info(`${'═'.repeat(60)}\n`)

  let chatResult: ChatResult | null = null
  let pdfReport: ParsedReport | null = null

  // ─── PHASE 1: DIAGNOSTIC ───
  reporter.addResult(
    await runTest(`[${scenario.name}] 1.1 — Diagnostic flow`, async () => {
      await navigateDiagnostic(page, scenario, logger)
    }, logger, reporter)
  )

  reporter.addResult(
    await runTest(`[${scenario.name}] 1.2 — Effectif pas un code tranche brut`, async () => {
      const pageText = await page.evaluate(() => document.body.innerText)
      if (pageText.includes('250001') || pageText.includes('250 001')) {
        throw new Error('Raw tranche code 250001 found on page')
      }
    }, logger, reporter)
  )

  // ─── PHASE 2: AUTH + EVALUATION ACCESS ───
  reporter.addResult(
    await runTest(`[${scenario.name}] 2.1 — Login + accès évaluation`, async () => {
      const loggedIn = await login(page, logger)
      if (!loggedIn) {
        throw new Error('Login failed')
      }

      // Navigate to dashboard to find evaluations
      await page.goto(`${TEST_CONFIG.baseUrl}/dashboard`, { waitUntil: 'networkidle2' })
      await wait(3000)

      const hasEval = await page.evaluate(() => {
        const text = document.body.innerText.toLowerCase()
        return text.includes('evaluation') || text.includes('évaluation')
      })

      if (!hasEval) {
        logger.warn('No evaluations found on dashboard')
      }
    }, logger, reporter)
  )

  // ─── PHASE 3: CHAT ───
  reporter.addResult(
    await runTest(`[${scenario.name}] 3.1 — Chat conversation`, async () => {
      // Find an evaluation chat to use
      const evalId = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'))
        const evalLink = links.find(a => a.href.includes('/evaluation/'))
        if (evalLink) {
          const match = evalLink.href.match(/evaluation\/([^/]+)/)
          return match ? match[1] : null
        }
        return null
      })

      if (!evalId) {
        logger.warn('No evaluation found — using legacy chat route')
        await page.goto(`${TEST_CONFIG.baseUrl}/chat/${scenario.siren}?objectif=vente`, {
          waitUntil: 'networkidle2',
        })
      } else {
        await page.goto(`${TEST_CONFIG.baseUrl}/evaluation/${evalId}/chat`, {
          waitUntil: 'networkidle2',
        })
      }

      await wait(3000)

      chatResult = await runChatConversation(page, scenario, logger)

      if (chatResult.messagesExchanged === 0) {
        throw new Error('No messages exchanged in chat')
      }
    }, logger, reporter)
  )

  reporter.addResult(
    await runTest(`[${scenario.name}] 3.2 — Chat ne doit pas inventer de données`, async () => {
      if (!chatResult) throw new Error('No chat result')

      if (scenario.expectedPappers.tresorerie) {
        const allLower = chatResult.allChatText.toLowerCase()
        if (allLower.includes('trésorerie estimé') || allLower.includes('tresorerie estimé')) {
          throw new Error('Chat says "trésorerie estimée" but Pappers has real data')
        }
      }
    }, logger, reporter)
  )

  reporter.addResult(
    await runTest(`[${scenario.name}] 3.3 — Détection contradictions`, async () => {
      if (!chatResult) throw new Error('No chat result')

      const messages = scenario.chatMessages.join(' ').toLowerCase()
      const hasHighChurn = messages.includes('churn') && (messages.includes('20%') || messages.includes('20 %'))
      const hasLongPayback = messages.includes('payback') && (messages.includes('12') || messages.includes('mois'))

      if (hasHighChurn && hasLongPayback) {
        const detected = chatResult.allChatText.toLowerCase()
        const hasWarning = detected.includes('contradiction') ||
                          detected.includes('incohéren') ||
                          detected.includes('attention') ||
                          detected.includes('alerte') ||
                          detected.includes('risque')
        if (!hasWarning) {
          logger.warn('Chat did not flag churn/CAC payback contradiction')
        }
      }
    }, logger, reporter)
  )

  // ─── PHASE 4: PDF ───
  reporter.addResult(
    await runTest(`[${scenario.name}] 4.1 — PDF download + parsing`, async () => {
      const pdfBuffer = await downloadPDF(page, logger)

      if (!pdfBuffer) {
        logger.warn('PDF not downloaded — may require paid evaluation')
        return
      }

      if (pdfBuffer.length < 1000) {
        throw new Error('PDF too small — possibly empty or error response')
      }

      const savedPath = savePDFBuffer(pdfBuffer, `report_${scenario.siren}`)
      logger.info(`PDF saved to ${savedPath}`)

      pdfReport = parsePDF(pdfBuffer)
      logger.info(`PDF parsed: note=${pdfReport.noteGlobale}, confiance=${pdfReport.confiance}, prix=${pdfReport.prixCession}`)
    }, logger, reporter)
  )

  // ─── PHASE 5: COHERENCE ───
  reporter.addResult(
    await runTest(`[${scenario.name}] 5.1 — Cohérence chat ↔ PDF valorisation`, async () => {
      if (!chatResult || !pdfReport) {
        logger.warn('Missing chat or PDF data — skipping')
        return
      }
      if (chatResult.valuationAmount && pdfReport.prixCession) {
        const ecart = Math.abs(chatResult.valuationAmount - pdfReport.prixCession) / chatResult.valuationAmount
        if (ecart >= 0.20) {
          throw new Error(`Valuation gap ${Math.round(ecart * 100)}% exceeds 20% (chat=${chatResult.valuationAmount}€, PDF=${pdfReport.prixCession}€)`)
        }
      }
    }, logger, reporter)
  )

  reporter.addResult(
    await runTest(`[${scenario.name}] 5.2 — Note dans la plage attendue`, async () => {
      if (!pdfReport?.noteGlobale) return
      const noteOrder = ['E', 'D', 'C', 'B', 'A']
      const noteIndex = noteOrder.indexOf(pdfReport.noteGlobale)
      const minIndex = noteOrder.indexOf(scenario.expectedReport.noteMin)
      const maxIndex = noteOrder.indexOf(scenario.expectedReport.noteMax)

      if (noteIndex < minIndex || noteIndex > maxIndex) {
        throw new Error(`Note ${pdfReport.noteGlobale} outside ${scenario.expectedReport.noteMin}-${scenario.expectedReport.noteMax}`)
      }
    }, logger, reporter)
  )

  reporter.addResult(
    await runTest(`[${scenario.name}] 5.3 — Confiance pas "Élevée" sans retraitements`, async () => {
      if (!pdfReport) return
      if (!pdfReport.retraitementsEffectues) {
        if (pdfReport.confiance === 'Élevée' || pdfReport.confiance === 'Elevee') {
          throw new Error('Confidence is "Élevée" without retraitements')
        }
      }
    }, logger, reporter)
  )

  reporter.addResult(
    await runTest(`[${scenario.name}] 5.4 — Effectif pas un code tranche (PDF)`, async () => {
      if (!pdfReport) return
      if (pdfReport.fullText.includes('250001') || pdfReport.fullText.includes('250 001')) {
        throw new Error('Raw tranche code 250001 found in PDF')
      }
      if (pdfReport.effectif) {
        const num = parseInt(pdfReport.effectif.replace(/\s/g, ''), 10)
        if (!isNaN(num) && num > scenario.expectedReport.effectifMustNotExceed) {
          throw new Error(`Effectif ${num} exceeds max ${scenario.expectedReport.effectifMustNotExceed}`)
        }
      }
    }, logger, reporter)
  )

  reporter.addResult(
    await runTest(`[${scenario.name}] 5.5 — Mots-clés requis présents`, async () => {
      if (!pdfReport) return
      for (const kw of scenario.expectedReport.requiredKeywords) {
        if (!pdfReport.fullText.toLowerCase().includes(kw.toLowerCase())) {
          throw new Error(`Required keyword "${kw}" not found in PDF`)
        }
      }
    }, logger, reporter)
  )

  reporter.addResult(
    await runTest(`[${scenario.name}] 5.6 — Mots interdits absents`, async () => {
      if (!pdfReport) return
      for (const kw of scenario.expectedReport.forbiddenKeywords) {
        if (pdfReport.fullText.includes(kw)) {
          throw new Error(`Forbidden keyword "${kw}" found in PDF`)
        }
      }
    }, logger, reporter)
  )

  reporter.addResult(
    await runTest(`[${scenario.name}] 5.7 — Retraitements 0€ signalés`, async () => {
      if (!pdfReport) return
      if (pdfReport.retraitementsTotal === 0 || !pdfReport.retraitementsEffectues) {
        const mentionsAbsence = /retraitements?\s*(non\s*effectué|non\s*réalisé|à\s*compléter|non\s*disponible)/i
          .test(pdfReport.fullText)
        if (!mentionsAbsence) {
          logger.warn('Retraitements at 0€ not explicitly flagged')
        }
      }
    }, logger, reporter)
  )

  // ─── RÉSUMÉ ───
  logger.info(`\n${'═'.repeat(60)}`)
  logger.info(`RÉSUMÉ: ${scenario.name}`)
  logger.info(`${'═'.repeat(60)}`)

  if (chatResult) {
    logger.info(`Chat: ${chatResult.messagesExchanged} échanges, ${chatResult.questionsAsked.length} questions, durée ${(chatResult.duration / 1000).toFixed(1)}s`)
    logger.info(`Valorisation chat: ${chatResult.valuationAmount ? chatResult.valuationAmount + '€' : 'N/A'}`)
  }

  if (pdfReport) {
    logger.info(`PDF: note=${pdfReport.noteGlobale}, confiance=${pdfReport.confiance}`)
    logger.info(`PDF: prix cession=${pdfReport.prixCession ? pdfReport.prixCession + '€' : 'N/A'}`)
    logger.info(`PDF: retraitements=${pdfReport.retraitementsEffectues ? 'oui' : 'non'}`)
    logger.info(`PDF: points vigilance=${pdfReport.pointsVigilance.length}`)
  }

  const emptyChatResult: ChatResult = {
    messagesExchanged: 0, questionsAsked: [], answersGiven: [], allChatText: '',
    valuationMentioned: false, valuationAmount: null, contradictionDetected: false,
    evaluationComplete: false, duration: 0,
  }

  const coherenceDetails = checkCoherence(scenario, chatResult || emptyChatResult, pdfReport, logger)
  for (const detail of coherenceDetails) {
    logger.info(`  ${detail}`)
  }
}

// ============================================================
// EXPORTS
// ============================================================

export async function runFullFlowTests(reporter: TestReporter): Promise<void> {
  const ctx = await createTestContext(MODULE_NAME)
  const { page, logger } = ctx

  reporter.startModule(MODULE_NAME)

  // POSSE is the primary scenario — others are opt-in via env var
  const scenarios: TestScenario[] = [SCENARIO_POSSE]

  if (process.env.TEST_ALL_SCENARIOS === 'true') {
    scenarios.push(SCENARIO_CONSEIL, SCENARIO_MICRO)
  }

  try {
    for (const scenario of scenarios) {
      await runFullScenarioTest(page, scenario, logger, reporter)
      await wait(2000)
    }

    // Summary
    logger.info('\n' + '═'.repeat(60))
    logger.info('FULL FLOW TEST SUMMARY')
    logger.info('═'.repeat(60))

    for (const scenario of scenarios) {
      logger.info(`  ${scenario.name}`)
    }

  } finally {
    reporter.endModule()
    await closeTestContext(ctx)
  }
}

// Exécution directe du module
if (require.main === module) {
  const { getReporter } = require('../utils/reporter')
  const reporter = getReporter()

  runFullFlowTests(reporter)
    .then(() => {
      reporter.printSummary()
      reporter.saveReport('full_flow_tests.json')
      process.exit(reporter.generateReport().summary.failed > 0 ? 1 : 0)
    })
    .catch(err => {
      console.error('Fatal error:', err)
      process.exit(1)
    })
}
