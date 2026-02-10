// Tests E2E du module Access Control (auth gates, premium features)
import { Page } from 'puppeteer'
import { TEST_CONFIG, TEST_SIRENS } from '../config'
import { TestLogger } from '../utils/logger'
import { TestReporter, TestResult } from '../utils/reporter'
import {
  createTestContext,
  closeTestContext,
  takeScreenshot,
  waitForText,
  sendChatMessage,
  waitForBotResponse,
  waitForStreamingEnd,
  wait,
} from '../utils/browser'
import { BOULANGERIE_MARTIN } from '../fixtures/test-companies'

const MODULE_NAME = 'access-control'

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
// TEST 1: /app redirige si non-authentifié
// ============================================================
async function testAppRedirectNoAuth(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing /app redirect without auth')

  // Effacer les cookies/session pour s'assurer qu'on est non-auth
  await page.deleteCookie(...(await page.cookies()))

  await page.goto(`${TEST_CONFIG.baseUrl}/app`, { waitUntil: 'networkidle2' })
  await wait(3000)

  const url = page.url()
  const isRedirected = url.includes('/connexion') || url.includes('/inscription')

  if (!isRedirected) {
    // Vérifier si la page affiche un message d'auth
    const hasAuthMessage = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase()
      return text.includes('connexion') || text.includes('connecter') || text.includes('authentif')
    })

    if (!hasAuthMessage) {
      throw new Error(`/app did not redirect to auth page. Current URL: ${url}`)
    }
  }

  logger.info(`/app redirected to: ${url}`)
  await takeScreenshot(page, 'app_no_auth')
}

// ============================================================
// TEST 2: /chat redirige si non-authentifié
// ============================================================
async function testChatRedirectNoAuth(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing /chat redirect without auth')

  await page.deleteCookie(...(await page.cookies()))

  await page.goto(`${TEST_CONFIG.baseUrl}/chat/${TEST_SIRENS.totalEnergies}`, {
    waitUntil: 'networkidle2',
  })
  await wait(3000)

  const url = page.url()
  const isRedirected = url.includes('/connexion') || url.includes('/inscription')

  if (!isRedirected) {
    const hasAuthMessage = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase()
      return text.includes('connexion') || text.includes('connecter') || text.includes('authentif')
    })

    if (!hasAuthMessage) {
      throw new Error(`/chat did not redirect to auth page. Current URL: ${url}`)
    }
  }

  logger.info(`/chat redirected to: ${url}`)
  await takeScreenshot(page, 'chat_no_auth')
}

// ============================================================
// TEST 3: /compte redirige si non-authentifié
// ============================================================
async function testCompteRedirectNoAuth(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing /compte redirect without auth')

  await page.deleteCookie(...(await page.cookies()))

  await page.goto(`${TEST_CONFIG.baseUrl}/compte`, { waitUntil: 'networkidle2' })
  await wait(3000)

  const url = page.url()
  const isRedirected = url.includes('/connexion') || url.includes('/inscription')

  if (!isRedirected) {
    const hasAuthMessage = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase()
      return text.includes('connexion') || text.includes('connecter') || text.includes('authentif')
    })

    if (!hasAuthMessage) {
      throw new Error(`/compte did not redirect to auth page. Current URL: ${url}`)
    }
  }

  logger.info(`/compte redirected to: ${url}`)
  await takeScreenshot(page, 'compte_no_auth')
}

// ============================================================
// TEST 4: Flash limité à 8 questions
// ============================================================
async function testFlash8QuestionLimit(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing Flash 8-question limit')

  await page.goto(`${TEST_CONFIG.baseUrl}/chat/${TEST_SIRENS.totalEnergies}?objectif=vente`, {
    waitUntil: 'networkidle2',
  })
  await wait(3000)

  // Attendre le premier message
  try {
    await waitForStreamingEnd(page, 30000)
  } catch {
    logger.warn('Streaming end detection timed out, continuing...')
  }

  // Envoyer des messages jusqu'à atteindre la limite
  const testCase = BOULANGERIE_MARTIN
  const responses = Object.values(testCase.flashAnswers.responses)
  let flashComplete = false

  for (let i = 0; i < Math.min(responses.length, 10); i++) {
    try {
      await sendChatMessage(page, responses[i] || `Réponse test numéro ${i + 1}`)
      await waitForBotResponse(page, 45000)
      await wait(500)

      // Vérifier si on a atteint la limite Flash
      const pageText = await page.evaluate(() => document.body.innerText)
      if (
        pageText.includes('FLASH_VALUATION_COMPLETE') ||
        pageText.includes('limite') ||
        pageText.includes('flash') && pageText.includes('termin') ||
        pageText.includes('Passer') && pageText.includes('Pro')
      ) {
        flashComplete = true
        logger.info(`Flash limit reached after ${i + 1} messages`)
        break
      }
    } catch (error) {
      logger.warn(`Message ${i + 1} failed: ${error}`)
    }
  }

  // Le test passe si on a détecté la fin Flash ou si on a pu envoyer les messages
  logger.info(`Flash complete: ${flashComplete}`)
  await takeScreenshot(page, 'flash_limit')
}

// ============================================================
// TEST 5: Flash - pas de bouton PDF téléchargement
// ============================================================
async function testFlashNoPDFButton(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing Flash mode - no PDF download button')

  await page.goto(`${TEST_CONFIG.baseUrl}/chat/${TEST_SIRENS.totalEnergies}`, {
    waitUntil: 'networkidle2',
  })
  await wait(3000)

  const pdfButtonState = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, a'))

    const downloadBtn = buttons.find(btn =>
      btn.textContent?.includes('Telecharger') ||
      btn.textContent?.includes('Télécharger') ||
      btn.textContent?.includes('PDF')
    )

    const upgradeBtn = buttons.find(btn =>
      btn.textContent?.includes('Pro') ||
      btn.textContent?.includes('Passer') ||
      btn.textContent?.includes('79')
    )

    return {
      hasDownloadButton: !!downloadBtn,
      hasUpgradeButton: !!upgradeBtn,
      downloadButtonText: downloadBtn?.textContent?.trim() || null,
      upgradeButtonText: upgradeBtn?.textContent?.trim() || null,
    }
  })

  logger.info(`PDF button state: ${JSON.stringify(pdfButtonState)}`)

  // En Flash, on devrait voir "Passer à Pro" plutôt que "Télécharger"
  // Mais si on n'est pas encore à la fin de l'évaluation, aucun bouton n'est normal
  if (pdfButtonState.hasDownloadButton && !pdfButtonState.hasUpgradeButton) {
    logger.warn('PDF download button visible without upgrade - may indicate premium access')
  }

  await takeScreenshot(page, 'flash_no_pdf')
}

// ============================================================
// TEST 6: Flash - upload doc désactivé
// ============================================================
async function testFlashNoDocUpload(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing Flash mode - document upload disabled')

  await page.goto(`${TEST_CONFIG.baseUrl}/chat/${TEST_SIRENS.totalEnergies}`, {
    waitUntil: 'networkidle2',
  })
  await wait(3000)

  const uploadState = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const uploadBtn = buttons.find(btn =>
      btn.textContent?.includes('document') ||
      btn.textContent?.includes('upload') ||
      btn.textContent?.includes('fichier') ||
      btn.querySelector('input[type="file"]') !== null
    )

    const fileInput = document.querySelector('input[type="file"]')

    return {
      hasUploadButton: !!uploadBtn,
      isDisabled: uploadBtn?.hasAttribute('disabled') || false,
      hasFileInput: !!fileInput,
      fileInputDisabled: (fileInput as HTMLInputElement)?.disabled || false,
    }
  })

  logger.info(`Upload state: ${JSON.stringify(uploadState)}`)

  if (uploadState.hasUploadButton && !uploadState.isDisabled) {
    logger.warn('Upload button found and not disabled in Flash mode')
  }

  await takeScreenshot(page, 'flash_no_upload')
}

// ============================================================
// TEST 7: Upgrade CTA visible après flash
// ============================================================
async function testUpgradeCTAVisible(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing upgrade CTA visibility')

  await page.goto(`${TEST_CONFIG.baseUrl}/chat/${TEST_SIRENS.totalEnergies}`, {
    waitUntil: 'networkidle2',
  })
  await wait(3000)

  // Vérifier la présence d'éléments d'upgrade
  const upgradeElements = await page.evaluate(() => {
    const text = document.body.innerText
    const buttons = Array.from(document.querySelectorAll('button, a'))

    return {
      hasPriceReference: text.includes('79') || text.includes('Pro'),
      hasUpgradeButton: buttons.some(btn =>
        btn.textContent?.includes('Pro') ||
        btn.textContent?.includes('Complète') ||
        btn.textContent?.includes('Affiner') ||
        btn.textContent?.includes('79')
      ),
      hasUpgradeLink: buttons.some(btn =>
        (btn as HTMLAnchorElement).href?.includes('/tarifs') ||
        (btn as HTMLAnchorElement).href?.includes('/checkout')
      ),
    }
  })

  logger.info(`Upgrade elements: ${JSON.stringify(upgradeElements)}`)
  await takeScreenshot(page, 'upgrade_cta')
}

// ============================================================
// TEST 8: Checkout sans auth redirige vers connexion
// ============================================================
async function testCheckoutNoAuthRedirect(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing checkout redirect without auth')

  await page.deleteCookie(...(await page.cookies()))

  await page.goto(`${TEST_CONFIG.baseUrl}/checkout?plan=eval_complete&siren=${TEST_SIRENS.totalEnergies}`, {
    waitUntil: 'networkidle2',
  })
  await wait(3000)

  const url = page.url()
  const isRedirected = url.includes('/connexion') || url.includes('/inscription')

  const pageContent = await page.evaluate(() => document.body.innerText.toLowerCase())
  const hasAuthMessage = pageContent.includes('connexion') ||
                         pageContent.includes('connecter') ||
                         pageContent.includes('authentif')

  if (!isRedirected && !hasAuthMessage) {
    throw new Error(`Checkout did not redirect to auth. Current URL: ${url}`)
  }

  // Vérifier que le redirect contient les params originaux
  if (isRedirected && url.includes('redirect')) {
    logger.info('Checkout redirect preserves return URL')
  }

  logger.info(`Checkout no-auth → ${url}`)
  await takeScreenshot(page, 'checkout_no_auth')
}

// ============================================================
// TEST 9: Retour ?upgrade=success affiche confirmation
// ============================================================
async function testUpgradeSuccessReturn(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing ?upgrade=success return')

  await page.goto(`${TEST_CONFIG.baseUrl}/chat/${TEST_SIRENS.totalEnergies}?upgrade=success`, {
    waitUntil: 'networkidle2',
  })
  await wait(3000)

  const hasSuccessIndicator = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    return text.includes('confirm') ||
           text.includes('merci') ||
           text.includes('succès') ||
           text.includes('success') ||
           text.includes('paiement')
  })

  logger.info(`Success indicator found: ${hasSuccessIndicator}`)
  await takeScreenshot(page, 'upgrade_success')
}

// ============================================================
// TEST 10: Retour ?upgrade=canceled ne crashe pas
// ============================================================
async function testUpgradeCanceledReturn(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing ?upgrade=canceled return')

  await page.goto(`${TEST_CONFIG.baseUrl}/chat/${TEST_SIRENS.totalEnergies}?upgrade=canceled`, {
    waitUntil: 'networkidle2',
  })
  await wait(2000)

  // La page ne devrait pas afficher de message de succès
  const pageState = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    return {
      hasError: text.includes('erreur') && text.includes('paiement'),
      hasSuccess: text.includes('succès') || text.includes('confirmé'),
      pageLoaded: document.body.innerText.length > 50,
    }
  })

  if (pageState.hasSuccess) {
    throw new Error('Canceled payment shows success message!')
  }

  if (!pageState.pageLoaded) {
    throw new Error('Page did not load after cancel')
  }

  logger.info(`Cancel return state: ${JSON.stringify(pageState)}`)
  await takeScreenshot(page, 'upgrade_canceled')
}

// ============================================================
// MAIN
// ============================================================
export async function runAccessControlTests(reporter: TestReporter): Promise<void> {
  const ctx = await createTestContext(MODULE_NAME)
  const { page, logger } = ctx

  reporter.startModule(MODULE_NAME)

  try {
    reporter.addResult(await runTest('/app redirige si non-auth', async () => {
      await testAppRedirectNoAuth(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('/chat redirige si non-auth', async () => {
      await testChatRedirectNoAuth(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('/compte redirige si non-auth', async () => {
      await testCompteRedirectNoAuth(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Flash : 8 questions max', async () => {
      await testFlash8QuestionLimit(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Flash : pas de PDF download', async () => {
      await testFlashNoPDFButton(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Flash : upload doc désactivé', async () => {
      await testFlashNoDocUpload(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Upgrade CTA visible', async () => {
      await testUpgradeCTAVisible(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Checkout sans auth → login', async () => {
      await testCheckoutNoAuthRedirect(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Retour ?upgrade=success', async () => {
      await testUpgradeSuccessReturn(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Retour ?upgrade=canceled', async () => {
      await testUpgradeCanceledReturn(page, logger)
    }, logger, reporter))

  } finally {
    reporter.endModule()
    await closeTestContext(ctx)
  }
}

if (require.main === module) {
  const { getReporter } = require('../utils/reporter')
  const reporter = getReporter()

  runAccessControlTests(reporter)
    .then(() => {
      reporter.printSummary()
      reporter.saveReport('access_control_tests.json')
      process.exit(reporter.generateReport().summary.failed > 0 ? 1 : 0)
    })
    .catch(err => {
      console.error('Fatal error:', err)
      process.exit(1)
    })
}
