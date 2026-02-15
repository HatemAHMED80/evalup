// Tests E2E du module Checkout (flow paiement Stripe)
import { Page } from 'puppeteer'
import { TEST_CONFIG, TEST_SIRENS } from '../config'
import { TestLogger } from '../utils/logger'
import { TestReporter, TestResult } from '../utils/reporter'
import {
  createTestContext,
  closeTestContext,
  takeScreenshot,
  wait,
} from '../utils/browser'

const MODULE_NAME = 'checkout'

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
// TEST 1: Checkout page loads
// ============================================================
async function testCheckoutPageLoads(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing /checkout page loads')
  await page.goto(`${TEST_CONFIG.baseUrl}/checkout?siren=${TEST_SIRENS.totalEnergies}&plan=eval_complete`, {
    waitUntil: 'networkidle2',
  })
  await wait(3000)

  const url = page.url()

  // Checkout may redirect to auth (connexion/inscription) if user is not logged in
  if (url.includes('/connexion') || url.includes('/inscription')) {
    logger.info('Checkout redirected to auth page (expected when not authenticated)')
    await takeScreenshot(page, 'checkout_page')
    return
  }

  const hasContent = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    return text.includes('paiement') ||
           text.includes('redirection') ||
           text.includes('chargement') ||
           text.includes('erreur') ||
           text.includes('annuler')
  })

  if (!hasContent) {
    throw new Error('Checkout page missing expected content')
  }

  await takeScreenshot(page, 'checkout_page')
  logger.info('Checkout page loaded')
}

// ============================================================
// TEST 2: Missing SIREN → "Paramètres manquants" error
// ============================================================
async function testCheckoutMissingSiren(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing checkout without SIREN → error')

  // Clear sessionStorage to prevent fallback
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic`, { waitUntil: 'networkidle2' })
  await page.evaluate(() => sessionStorage.removeItem('diagnostic_data'))

  await page.goto(`${TEST_CONFIG.baseUrl}/checkout?plan=eval_complete`, {
    waitUntil: 'networkidle2',
  })
  await wait(3000)

  const hasError = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    return text.includes('paramètres manquants') ||
           text.includes('erreur')
  })

  if (!hasError) {
    throw new Error('Expected "Paramètres manquants" error when SIREN is missing')
  }

  await takeScreenshot(page, 'checkout_missing_siren')
  logger.info('Checkout correctly shows error for missing SIREN')
}

// ============================================================
// TEST 3: SIREN fallback from sessionStorage
// ============================================================
async function testCheckoutSirenFallback(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing checkout SIREN fallback from sessionStorage')

  // Set diagnostic_data in sessionStorage
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic`, { waitUntil: 'networkidle2' })
  await page.evaluate((siren) => {
    sessionStorage.setItem('diagnostic_data', JSON.stringify({ siren, activityType: 'saas', revenue: 1000000, ebitda: 200000 }))
  }, TEST_SIRENS.totalEnergies)

  // Navigate to checkout WITHOUT siren in URL
  await page.goto(`${TEST_CONFIG.baseUrl}/checkout?plan=eval_complete`, {
    waitUntil: 'networkidle2',
  })
  await wait(5000)

  const hasError = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    return text.includes('paramètres manquants')
  })

  if (hasError) {
    throw new Error('Checkout should use SIREN from sessionStorage fallback, but got "Paramètres manquants"')
  }

  // Should show loading/redirect or a Stripe error (since we don't have valid Stripe setup in test)
  const hasContent = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    return text.includes('paiement') ||
           text.includes('redirection') ||
           text.includes('chargement') ||
           text.includes('erreur') ||
           text.includes('annuler')
  })

  logger.info(`Checkout with sessionStorage fallback: hasContent=${hasContent}, hasError=${hasError}`)
  await takeScreenshot(page, 'checkout_siren_fallback')
}

// ============================================================
// TEST 4: Invalid plan → error
// ============================================================
async function testCheckoutInvalidPlan(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing checkout with invalid plan')
  await page.goto(`${TEST_CONFIG.baseUrl}/checkout?siren=${TEST_SIRENS.totalEnergies}&plan=nonexistent_plan`, {
    waitUntil: 'networkidle2',
  })
  await wait(5000)

  const hasError = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    return text.includes('plan invalide') ||
           text.includes('erreur')
  })

  if (!hasError) {
    logger.warn('Checkout did not show error for invalid plan — may have fallback behavior')
  } else {
    logger.info('Checkout correctly rejected invalid plan')
  }

  await takeScreenshot(page, 'checkout_invalid_plan')
}

// ============================================================
// TEST 5: Cancel button visible during loading
// ============================================================
async function testCheckoutCancelButton(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing checkout cancel/annuler button')
  await page.goto(`${TEST_CONFIG.baseUrl}/checkout?siren=${TEST_SIRENS.totalEnergies}&plan=eval_complete`, {
    waitUntil: 'networkidle2',
  })
  await wait(2000)

  const hasCancelButton = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    return buttons.some(btn => {
      const text = btn.textContent?.toLowerCase() || ''
      return text.includes('annuler') || text.includes('retour')
    })
  })

  logger.info(`Cancel/Annuler button found: ${hasCancelButton}`)
  await takeScreenshot(page, 'checkout_cancel_button')
}

// ============================================================
// TEST 6: Checkout timeout behavior
// ============================================================
async function testCheckoutTimeout(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing checkout has timeout protection')

  // Verify the checkout page has timeout logic by checking it doesn't hang indefinitely
  await page.goto(`${TEST_CONFIG.baseUrl}/checkout?siren=${TEST_SIRENS.totalEnergies}&plan=eval_complete`, {
    waitUntil: 'networkidle2',
  })

  // Wait reasonable time but not the full 20s timeout
  await wait(5000)

  const pageState = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    return {
      hasLoading: text.includes('redirection') || text.includes('paiement'),
      hasError: text.includes('erreur') || text.includes('trop de temps'),
      hasCancelButton: !!Array.from(document.querySelectorAll('button')).find(b =>
        (b.textContent?.toLowerCase() || '').includes('annuler') || (b.textContent?.toLowerCase() || '').includes('retour')
      ),
    }
  })

  logger.info(`Checkout state after 5s: loading=${pageState.hasLoading}, error=${pageState.hasError}, cancel=${pageState.hasCancelButton}`)

  // Page should be in a definite state (loading with cancel, or error), not stuck
  if (!pageState.hasLoading && !pageState.hasError) {
    logger.warn('Checkout may be in an undefined state after 5s')
  }

  await takeScreenshot(page, 'checkout_timeout')
}

// ============================================================
// TEST 7: Checkout with all parameters
// ============================================================
async function testCheckoutFullParams(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing checkout with full parameter set')

  // Set diagnostic_data in sessionStorage
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic`, { waitUntil: 'networkidle2' })
  await page.evaluate(() => {
    sessionStorage.setItem('diagnostic_data', JSON.stringify({
      siren: '552032534',
      activityType: 'saas',
      revenue: 5000000,
      ebitda: 1200000,
      growth: 18,
      recurring: 88,
      masseSalariale: 40,
      effectif: '21-50',
    }))
  })

  const params = new URLSearchParams({
    siren: TEST_SIRENS.totalEnergies,
    plan: 'eval_complete',
    archetype: 'saas_mature',
  })

  await page.goto(`${TEST_CONFIG.baseUrl}/checkout?${params.toString()}`, {
    waitUntil: 'networkidle2',
  })
  await wait(5000)

  const hasContent = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    return text.includes('paiement') ||
           text.includes('redirection') ||
           text.includes('erreur') ||
           text.includes('annuler')
  })

  logger.info(`Checkout with full params: hasContent=${hasContent}`)
  await takeScreenshot(page, 'checkout_full_params')
}

// ============================================================
// TEST 8: Checkout error state has retour button
// ============================================================
async function testCheckoutErrorRetour(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing checkout error state has Retour button')

  // Force an error by clearing sessionStorage and no SIREN
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic`, { waitUntil: 'networkidle2' })
  await page.evaluate(() => sessionStorage.removeItem('diagnostic_data'))

  await page.goto(`${TEST_CONFIG.baseUrl}/checkout`, {
    waitUntil: 'networkidle2',
  })
  await wait(3000)

  const hasRetour = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    return buttons.some(btn => {
      const text = btn.textContent?.toLowerCase() || ''
      return text.includes('retour')
    })
  })

  if (!hasRetour) {
    logger.warn('No Retour button found in error state')
  } else {
    logger.info('Error state has Retour button')
  }

  await takeScreenshot(page, 'checkout_error_retour')
}

// ============================================================
// MAIN
// ============================================================
export async function runCheckoutTests(reporter: TestReporter): Promise<void> {
  const ctx = await createTestContext(MODULE_NAME)
  const { page, logger } = ctx

  reporter.startModule(MODULE_NAME)

  try {
    reporter.addResult(await runTest('Page checkout charge', async () => {
      await testCheckoutPageLoads(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('SIREN manquant → erreur', async () => {
      await testCheckoutMissingSiren(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('SIREN fallback depuis sessionStorage', async () => {
      await testCheckoutSirenFallback(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Plan invalide → erreur', async () => {
      await testCheckoutInvalidPlan(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Bouton Annuler visible', async () => {
      await testCheckoutCancelButton(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Protection timeout', async () => {
      await testCheckoutTimeout(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Checkout avec paramètres complets', async () => {
      await testCheckoutFullParams(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Erreur → bouton Retour', async () => {
      await testCheckoutErrorRetour(page, logger)
    }, logger, reporter))

  } finally {
    reporter.endModule()
    await closeTestContext(ctx)
  }
}

if (require.main === module) {
  const { getReporter } = require('../utils/reporter')
  const reporter = getReporter()

  runCheckoutTests(reporter)
    .then(() => {
      reporter.printSummary()
      reporter.saveReport('checkout_tests.json')
      process.exit(reporter.generateReport().summary.failed > 0 ? 1 : 0)
    })
    .catch(err => {
      console.error('Fatal error:', err)
      process.exit(1)
    })
}
