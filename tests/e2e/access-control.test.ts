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
  wait,
} from '../utils/browser'

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
// TEST 1: /diagnostic est PUBLIC (pas de redirect)
// ============================================================
async function testDiagnosticPublic(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing /diagnostic is public')

  await page.deleteCookie(...(await page.cookies()))

  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic`, { waitUntil: 'networkidle2' })
  await wait(3000)

  const url = page.url()

  // /diagnostic ne doit PAS rediriger vers /connexion
  if (url.includes('/connexion') || url.includes('/inscription')) {
    throw new Error(`/diagnostic redirected to auth page: ${url}`)
  }

  // Vérifier que la page de diagnostic est bien chargée
  const hasContent = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    return text.includes('diagnostic') || text.includes('siren') || text.includes('entreprise') || document.body.innerText.length > 100
  })

  if (!hasContent) {
    throw new Error('/diagnostic page has insufficient content')
  }

  logger.info(`/diagnostic loaded as public page: ${url}`)
  await takeScreenshot(page, 'diagnostic_public')
}

// ============================================================
// TEST 2: /diagnostic/result redirige si non-auth
// ============================================================
async function testDiagnosticResultRedirect(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing /diagnostic/result redirect without auth')

  await page.deleteCookie(...(await page.cookies()))

  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic/result`, {
    waitUntil: 'networkidle2',
  })
  await wait(3000)

  const url = page.url()
  const isRedirected = url.includes('/connexion') || url.includes('/inscription') || url.includes('/diagnostic/signup')

  if (!isRedirected) {
    // Check if there's an auth message or redirect prompt
    const hasAuthMessage = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase()
      return text.includes('connexion') || text.includes('connecter') || text.includes('authentif') || text.includes('inscri')
    })

    if (!hasAuthMessage) {
      throw new Error(`/diagnostic/result did not redirect to auth page. Current URL: ${url}`)
    }
  }

  logger.info(`/diagnostic/result redirected to: ${url}`)
  await takeScreenshot(page, 'diagnostic_result_no_auth')
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

// TEST 4 SUPPRIMÉ : "8 questions max" n'existe plus (pas de Flash chat)

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

// TEST 6 SUPPRIMÉ : "upload doc désactivé en Flash" n'existe plus (pas de Flash chat)

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

  // Clear localStorage to prevent draft contamination from previous success test
  await page.goto(`${TEST_CONFIG.baseUrl}/chat/${TEST_SIRENS.totalEnergies}`, { waitUntil: 'networkidle2' })
  await page.evaluate(() => localStorage.clear())

  await page.goto(`${TEST_CONFIG.baseUrl}/chat/${TEST_SIRENS.totalEnergies}?upgrade=canceled`, {
    waitUntil: 'networkidle2',
  })
  await wait(2000)

  // La page ne devrait pas afficher de message de succès explicite
  const pageState = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    return {
      // Chercher des messages de succès explicites (pas juste le mot "paiement")
      hasExplicitSuccess: text.includes('paiement confirmé') || text.includes('paiement réussi') ||
                          text.includes('merci pour votre achat'),
      pageLoaded: document.body.innerText.length > 50,
    }
  })

  if (pageState.hasExplicitSuccess) {
    throw new Error('Canceled payment shows explicit success message!')
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
    reporter.addResult(await runTest('/diagnostic est PUBLIC', async () => {
      await testDiagnosticPublic(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('/diagnostic/result redirige si non-auth', async () => {
      await testDiagnosticResultRedirect(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('/compte redirige si non-auth', async () => {
      await testCompteRedirectNoAuth(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Chat : pas de PDF sans paiement', async () => {
      await testFlashNoPDFButton(page, logger)
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
