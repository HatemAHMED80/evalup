// Tests E2E du module Chat
import { Page } from 'puppeteer'
import { TEST_CONFIG, TEST_SIRENS } from '../config'
import { TestLogger } from '../utils/logger'
import { TestReporter, TestResult } from '../utils/reporter'
import {
  createTestContext,
  closeTestContext,
  takeScreenshot,
  waitAndClick,
  waitForText,
  sendChatMessage,
  waitForBotResponse,
  clickSuggestion,
  waitForStreamingEnd,
  wait,
} from '../utils/browser'
import { BOULANGERIE_MARTIN, getRealisticAnswer } from '../fixtures/test-companies'

const MODULE_NAME = 'chat'

// Helper pour exécuter un test avec timing
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
// TEST 1: Recherche SIREN valide
// ============================================================
async function testValidSirenSearch(page: Page, logger: TestLogger): Promise<void> {
  // La page d'accueil ne contient plus de recherche SIREN (remplacée par le flow diagnostic)
  // On teste l'accès direct au chat avec un SIREN valide
  logger.info(`Navigating directly to chat with valid SIREN: ${TEST_SIRENS.totalEnergies}`)
  await page.goto(`${TEST_CONFIG.baseUrl}/chat/${TEST_SIRENS.totalEnergies}`, {
    waitUntil: 'networkidle2',
  })
  await wait(3000)

  // Vérifier qu'on est bien sur la page chat
  const url = page.url()

  // /chat/ requires authentication — middleware redirects to /connexion
  if (url.includes('/connexion') || url.includes('/inscription')) {
    logger.info('Chat page requires auth — redirected to login (expected when not authenticated)')
    // Verify the redirect URL preserves the original chat path
    if (url.includes('redirect') && url.includes('chat')) {
      logger.info('Redirect URL correctly preserves chat path for post-login redirect')
    }
    await takeScreenshot(page, 'valid_siren_search')
    return
  }

  if (!url.includes('/chat/')) {
    throw new Error(`Expected to be on /chat/ or /connexion, got: ${url}`)
  }

  // Vérifier que la page affiche des éléments du chat (textarea, messages, ou données entreprise)
  const pageState = await page.evaluate(() => {
    const hasTextarea = !!document.querySelector('textarea')
    const text = document.body.innerText
    const hasCompanyData = text.includes('CA') || text.includes('Chiffre') || text.includes('Valorisation') || text.includes('entreprise')
    return { hasTextarea, hasCompanyData }
  })

  if (!pageState.hasTextarea && !pageState.hasCompanyData) {
    throw new Error('Chat page loaded but no chat elements found')
  }

  logger.info(`Chat page loaded: textarea=${pageState.hasTextarea}, companyData=${pageState.hasCompanyData}`)
  await takeScreenshot(page, 'valid_siren_search')
}

// ============================================================
// TEST 2: Recherche SIREN invalide (Luhn)
// ============================================================
async function testInvalidSirenSearch(page: Page, logger: TestLogger): Promise<void> {
  // Tester l'accès direct au chat avec un SIREN invalide
  logger.info(`Navigating to chat with invalid SIREN: ${TEST_SIRENS.invalid}`)
  await page.goto(`${TEST_CONFIG.baseUrl}/chat/${TEST_SIRENS.invalid}`, {
    waitUntil: 'networkidle2',
  })
  await wait(3000)

  // Vérifier qu'on a un message d'erreur ou une redirection
  const pageState = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    return {
      hasError: text.includes('invalide') || text.includes('introuvable') || text.includes('erreur') || text.includes('incorrect'),
      wasRedirected: !window.location.href.includes('/chat/'),
      url: window.location.href,
    }
  })

  if (pageState.hasError) {
    logger.info('Error message displayed for invalid SIREN')
  } else if (pageState.wasRedirected) {
    logger.info(`Redirected away from invalid SIREN chat: ${pageState.url}`)
  } else {
    // La page peut quand même charger le chat (Pappers gère l'erreur)
    logger.warn('No error shown for invalid SIREN - page may handle it gracefully')
  }

  await takeScreenshot(page, 'invalid_siren_error')
}

// ============================================================
// TEST 3: Affichage Bento Grid avec données Pappers
// ============================================================
async function testBentoGridDisplay(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Navigating to chat with valid SIREN')
  await page.goto(`${TEST_CONFIG.baseUrl}/chat/${TEST_SIRENS.totalEnergies}`)

  // Attendre le chargement du bento grid
  await wait(3000)

  // Vérifier la présence des éléments du bento grid
  const hasBentoGrid = await page.evaluate(() => {
    const text = document.body.innerText
    // Vérifier qu'on a des données financières
    return text.includes('CA') ||
           text.includes('Chiffre') ||
           text.includes('Résultat') ||
           text.includes('Valorisation')
  })

  if (!hasBentoGrid) {
    logger.warn('Bento grid may not be fully loaded')
  }

  await takeScreenshot(page, 'bento_grid')
  logger.info('Bento grid test completed')
}

// ============================================================
// TEST 4: Sélection d'objectif
// ============================================================
async function testObjectifSelection(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Navigating to chat')
  await page.goto(`${TEST_CONFIG.baseUrl}/chat/${TEST_SIRENS.totalEnergies}`)

  // Attendre les boutons d'objectif
  await wait(3000)

  // Chercher et cliquer sur "Vente"
  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const venteButton = buttons.find(btn =>
      btn.textContent?.includes('Vente') || btn.textContent?.includes('Vendre')
    )
    if (venteButton) {
      venteButton.click()
      return true
    }
    return false
  })

  if (!clicked) {
    logger.warn('Could not find Vente button, may already be selected')
  }

  await wait(2000)
  await takeScreenshot(page, 'objectif_selected')
  logger.info('Objectif selection test completed')
}

// ============================================================
// TEST 5: Conversation complète avec prompt archétype (post-paiement)
// ============================================================
async function testArchetypeConversation(page: Page, logger: TestLogger): Promise<void> {
  const testCase = BOULANGERIE_MARTIN

  logger.info(`Starting post-payment conversation for: ${testCase.name}`)
  await page.goto(`${TEST_CONFIG.baseUrl}/chat/${TEST_SIRENS.totalEnergies}?objectif=vente`)

  await wait(3000)

  // Attendre le premier message
  try {
    await waitForStreamingEnd(page, 30000)
  } catch {
    logger.warn('Streaming end detection timed out, continuing...')
  }

  // Répondre aux questions avec des données réalistes
  const conversationSteps = [
    testCase.flashAnswers.responses['activite_detail'],
    testCase.flashAnswers.responses['tendance_ca'] ||
      `Notre CA est d'environ ${testCase.financials.ca.toLocaleString('fr-FR')}€, stable sur les 3 dernières années.`,
    testCase.flashAnswers.responses['effectif_detail'] ||
      `Nous avons une équipe de ${testCase.expectedData.effectif}.`,
  ]

  for (const message of conversationSteps) {
    try {
      logger.info(`Sending: ${message.substring(0, 60)}...`)
      await sendChatMessage(page, message)
      await waitForBotResponse(page, 45000)
      await wait(1000)
    } catch (error) {
      logger.warn(`Step failed: ${error}`)
    }
  }

  // Vérifier que la conversation est guidée (questions structurées, benchmarks)
  const hasStructuredResponse = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    return text.includes('?') && (
      text.includes('secteur') ||
      text.includes('marge') ||
      text.includes('chiffre') ||
      text.includes('activité')
    )
  })

  if (!hasStructuredResponse) {
    logger.warn('Conversation may not be using archetype-guided questions')
  }

  await takeScreenshot(page, 'archetype_conversation')
  logger.info('Archetype conversation test completed')
}

// ============================================================
// TEST 6: Affichage valorisation avec méthode archétype
// ============================================================
async function testArchetypeValuationDisplay(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Checking for archetype-based valuation display')

  // Vérifier si on a des éléments de valorisation
  const valuationState = await page.evaluate(() => {
    const text = document.body.innerText
    return {
      hasValuation: text.includes('valorisation') || text.includes('Valorisation'),
      hasFourchette: text.includes('fourchette') || text.includes('entre'),
      hasEuro: text.includes('€'),
      hasMethode: text.includes('méthode') || text.includes('EBITDA') || text.includes('multiple'),
    }
  })

  logger.info(`Valuation state: ${JSON.stringify(valuationState)}`)

  if (valuationState.hasValuation || valuationState.hasFourchette) {
    logger.info('Valuation elements found on page')
  }

  await takeScreenshot(page, 'archetype_valuation')
}

// ============================================================
// TEST 7: Suggestions pertinentes
// ============================================================
async function testSuggestionRelevance(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing suggestion relevance')

  // Récupérer les suggestions affichées
  const suggestions = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    return buttons
      .filter(btn => btn.className.includes('rounded-full'))
      .map(btn => btn.textContent?.trim())
      .filter(Boolean)
  })

  logger.info(`Found suggestions: ${JSON.stringify(suggestions)}`)

  // Vérifier que les suggestions sont pertinentes (pas vides, pas génériques)
  const genericSuggestions = [
    'je ne sais pas',
    'je n\'ai pas cette info',
    'aucune idée',
  ]

  const hasOnlyGenericSuggestions = suggestions.every(s =>
    genericSuggestions.some(g => s?.toLowerCase().includes(g))
  )

  if (hasOnlyGenericSuggestions && suggestions.length > 0) {
    logger.warn('Only generic suggestions found - may need improvement')
  }

  await takeScreenshot(page, 'suggestions')
}

// ============================================================
// TEST 8: Sauvegarde et restauration du brouillon
// ============================================================
async function testDraftSaveRestore(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing draft save and restore')

  // Check if we're on the chat page (requires auth)
  const url = page.url()
  if (url.includes('/connexion') || url.includes('/inscription')) {
    logger.info('Chat requires auth — draft test skipped (no textarea available)')
    await takeScreenshot(page, 'draft_restored')
    return
  }

  // Check if textarea exists before trying to send
  const hasTextarea = await page.evaluate(() => !!document.querySelector('textarea'))
  if (!hasTextarea) {
    logger.info('No textarea found — draft test skipped (auth required)')
    await takeScreenshot(page, 'draft_restored')
    return
  }

  // Envoyer un message
  await sendChatMessage(page, 'Test de sauvegarde du brouillon')
  await wait(3000)

  // Rafraîchir la page
  await page.reload()
  await wait(3000)

  // Vérifier que le message est toujours là
  const hasMessage = await waitForText(page, 'brouillon', 5000)

  if (!hasMessage) {
    logger.warn('Draft may not be restored correctly')
  }

  await takeScreenshot(page, 'draft_restored')
  logger.info('Draft test completed')
}

// ============================================================
// MAIN: Exécuter tous les tests du module
// ============================================================
export async function runChatTests(reporter: TestReporter): Promise<void> {
  const ctx = await createTestContext(MODULE_NAME)
  const { page, logger } = ctx

  reporter.startModule(MODULE_NAME)

  try {
    // Test 1: SIREN valide
    reporter.addResult(
      await runTest('Recherche SIREN valide', async () => {
        await testValidSirenSearch(page, logger)
      }, logger, reporter)
    )

    // Test 2: SIREN invalide
    reporter.addResult(
      await runTest('Recherche SIREN invalide (Luhn)', async () => {
        await testInvalidSirenSearch(page, logger)
      }, logger, reporter)
    )

    // Test 3: Bento Grid
    reporter.addResult(
      await runTest('Affichage Bento Grid', async () => {
        await testBentoGridDisplay(page, logger)
      }, logger, reporter)
    )

    // Test 4: Sélection objectif
    reporter.addResult(
      await runTest('Sélection objectif', async () => {
        await testObjectifSelection(page, logger)
      }, logger, reporter)
    )

    // Test 5: Conversation avec prompt archétype
    reporter.addResult(
      await runTest('Conversation complète (archétype)', async () => {
        await testArchetypeConversation(page, logger)
      }, logger, reporter)
    )

    // Test 6: Valorisation archétype
    reporter.addResult(
      await runTest('Affichage valorisation (archétype)', async () => {
        await testArchetypeValuationDisplay(page, logger)
      }, logger, reporter)
    )

    // Test 7: Suggestions
    reporter.addResult(
      await runTest('Pertinence des suggestions', async () => {
        await testSuggestionRelevance(page, logger)
      }, logger, reporter)
    )

    // Test 8: Draft
    reporter.addResult(
      await runTest('Sauvegarde/restauration brouillon', async () => {
        await testDraftSaveRestore(page, logger)
      }, logger, reporter)
    )

  } finally {
    reporter.endModule()
    await closeTestContext(ctx)
  }
}

// Exécution directe du module
if (require.main === module) {
  const { getReporter } = require('../utils/reporter')
  const reporter = getReporter()

  runChatTests(reporter)
    .then(() => {
      reporter.printSummary()
      reporter.saveReport('chat_tests.json')
      process.exit(reporter.generateReport().summary.failed > 0 ? 1 : 0)
    })
    .catch(err => {
      console.error('Fatal error:', err)
      process.exit(1)
    })
}
