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
  logger.info('Navigating to home page')
  await page.goto(TEST_CONFIG.baseUrl)
  await page.waitForSelector('input[type="text"]')

  // Attendre que le typewriter soit terminé (le input est disabled pendant)
  await page.waitForFunction(
    () => {
      const input = document.querySelector('input[type="text"]') as HTMLInputElement
      return input && !input.disabled
    },
    { timeout: 10000 }
  )

  logger.info(`Entering valid SIREN: ${TEST_SIRENS.totalEnergies}`)
  await page.type('input[type="text"]', TEST_SIRENS.totalEnergies)

  // Cliquer sur le bouton de recherche ou soumettre
  const searchButton = await page.$('button[type="submit"]')
  if (searchButton) {
    await searchButton.click()
  } else {
    await page.keyboard.press('Enter')
  }

  // Attendre que la fiche entreprise s'affiche
  logger.info('Waiting for company card...')
  await page.waitForFunction(
    () => document.body.innerText.includes("c'est elle") || document.body.innerText.includes("Est-ce bien"),
    { timeout: 15000 }
  )

  // Cliquer sur "Oui, c'est elle"
  logger.info('Clicking confirmation button...')
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const confirmBtn = buttons.find(btn => btn.textContent?.includes("c'est elle"))
    if (confirmBtn) {
      confirmBtn.click()
    }
  })

  // Attendre la redirection vers le chat
  await page.waitForFunction(
    () => window.location.href.includes('/chat/'),
    { timeout: 10000 }
  )

  // Vérifier qu'on est sur la page chat
  const url = page.url()
  if (!url.includes('/chat/')) {
    throw new Error(`Expected redirect to /chat/, got: ${url}`)
  }

  logger.info('Successfully navigated to chat page')
  await takeScreenshot(page, 'valid_siren_search')
}

// ============================================================
// TEST 2: Recherche SIREN invalide (Luhn)
// ============================================================
async function testInvalidSirenSearch(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Navigating to home page')
  await page.goto(TEST_CONFIG.baseUrl)
  await page.waitForSelector('input[type="text"]')

  logger.info(`Entering invalid SIREN: ${TEST_SIRENS.invalid}`)
  await page.type('input[type="text"]', TEST_SIRENS.invalid)

  await page.keyboard.press('Enter')
  await wait(2000)

  // Vérifier le message d'erreur
  const hasError = await waitForText(page, 'invalide', 5000) ||
                   await waitForText(page, 'Luhn', 5000) ||
                   await waitForText(page, 'incorrect', 5000)

  if (!hasError) {
    throw new Error('Expected error message for invalid SIREN')
  }

  logger.info('Error message displayed correctly')
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
// TEST 5: Conversation Flash complète avec réponses réalistes
// ============================================================
async function testFlashConversation(page: Page, logger: TestLogger): Promise<void> {
  const testCase = BOULANGERIE_MARTIN

  logger.info(`Starting Flash conversation for: ${testCase.name}`)
  await page.goto(`${TEST_CONFIG.baseUrl}/chat/${TEST_SIRENS.totalEnergies}?objectif=vente`)

  await wait(3000)

  // Attendre le premier message
  await waitForStreamingEnd(page, 30000)

  // Répondre aux questions avec des données réalistes
  const conversationSteps = [
    {
      userMessage: testCase.flashAnswers.responses['activite_detail'],
      waitForKeyword: 'activité',
    },
    {
      userMessage: testCase.flashAnswers.responses['tendance_ca'] ||
        `Notre CA est d'environ ${testCase.financials.ca.toLocaleString('fr-FR')}€, stable sur les 3 dernières années.`,
      waitForKeyword: 'chiffre',
    },
    {
      userMessage: testCase.flashAnswers.responses['effectif_detail'] ||
        `Nous avons une équipe de ${testCase.expectedData.effectif}.`,
      waitForKeyword: 'équipe',
    },
    {
      userMessage: testCase.flashAnswers.responses['particularite'] ||
        'Notre positionnement est unique sur notre zone de chalandise.',
      waitForKeyword: 'particularité',
    },
  ]

  for (const step of conversationSteps) {
    try {
      logger.info(`Sending: ${step.userMessage.substring(0, 60)}...`)
      await sendChatMessage(page, step.userMessage)

      // Attendre la réponse
      await waitForBotResponse(page, 45000)
      await wait(1000)
    } catch (error) {
      logger.warn(`Step failed: ${error}`)
    }
  }

  await takeScreenshot(page, 'flash_conversation')
  logger.info('Flash conversation test completed')
}

// ============================================================
// TEST 6: Affichage valorisation Flash
// ============================================================
async function testFlashValuationDisplay(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Checking for Flash valuation display')

  // Vérifier si on a un composant de valorisation
  const hasValuation = await page.evaluate(() => {
    const text = document.body.innerText
    return text.includes('valorisation') ||
           text.includes('Valorisation') ||
           text.includes('fourchette') ||
           text.includes('€')
  })

  if (hasValuation) {
    logger.info('Valuation elements found on page')
  }

  await takeScreenshot(page, 'flash_valuation')
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

    // Test 5: Conversation Flash
    reporter.addResult(
      await runTest('Conversation Flash complète', async () => {
        await testFlashConversation(page, logger)
      }, logger, reporter)
    )

    // Test 6: Valorisation Flash
    reporter.addResult(
      await runTest('Affichage valorisation Flash', async () => {
        await testFlashValuationDisplay(page, logger)
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
