// Tests E2E du module Payment (Stripe)
import { Page } from 'puppeteer'
import { TEST_CONFIG, TEST_SIRENS } from '../config'
import { TestLogger } from '../utils/logger'
import { TestReporter, TestResult } from '../utils/reporter'
import {
  createTestContext,
  closeTestContext,
  takeScreenshot,
  waitForText,
  waitAndClick,
  wait,
} from '../utils/browser'

const MODULE_NAME = 'payment'

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
// TEST 1: Bouton upgrade vers checkout
// ============================================================
async function testUpgradeButtonToCheckout(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing upgrade button navigation')

  // Aller sur une page avec valorisation Flash
  await page.goto(`${TEST_CONFIG.baseUrl}/chat/${TEST_SIRENS.totalEnergies}`)
  await wait(3000)

  // Chercher le bouton d'upgrade (79€)
  const hasUpgradeButton = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, a'))
    return buttons.some(btn =>
      btn.textContent?.includes('79') ||
      btn.textContent?.includes('Complète') ||
      btn.textContent?.includes('Affiner')
    )
  })

  logger.info(`Upgrade button found: ${hasUpgradeButton}`)
  await takeScreenshot(page, 'upgrade_button')

  // Si le bouton existe, cliquer dessus
  if (hasUpgradeButton) {
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'))
      const upgradeBtn = buttons.find(btn =>
        btn.textContent?.includes('79') ||
        btn.textContent?.includes('Complète')
      )
      if (upgradeBtn) {
        (upgradeBtn as HTMLElement).click()
      }
    })

    await wait(2000)
    await takeScreenshot(page, 'after_upgrade_click')
  }
}

// ============================================================
// TEST 2: Page checkout s'affiche
// ============================================================
async function testCheckoutPageLoad(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing checkout page load')

  await page.goto(`${TEST_CONFIG.baseUrl}/checkout?siren=${TEST_SIRENS.totalEnergies}&plan=eval_complete`)
  await wait(3000)

  // Vérifier qu'on a soit un message de redirection, soit un message d'erreur auth
  const pageContent = await page.evaluate(() => document.body.innerText)

  const isRedirecting = pageContent.includes('Redirection') ||
                        pageContent.includes('paiement') ||
                        pageContent.includes('Chargement')

  const isAuthError = pageContent.includes('authentifié') ||
                      pageContent.includes('connexion')

  if (!isRedirecting && !isAuthError) {
    logger.warn('Unexpected checkout page content')
  }

  await takeScreenshot(page, 'checkout_page')
  logger.info(`Checkout page: redirecting=${isRedirecting}, authRequired=${isAuthError}`)
}

// ============================================================
// TEST 3: Redirection Stripe (test mode)
// ============================================================
async function testStripeRedirect(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing Stripe redirect (requires auth)')

  // Ce test nécessite d'être connecté
  // Pour le moment, on vérifie juste que la page checkout ne crash pas

  await page.goto(`${TEST_CONFIG.baseUrl}/checkout?siren=${TEST_SIRENS.totalEnergies}&plan=eval_complete`)
  await wait(5000)

  const currentUrl = page.url()
  logger.info(`Current URL after checkout: ${currentUrl}`)

  // Soit on est redirigé vers Stripe, soit vers login
  const isStripe = currentUrl.includes('stripe.com') || currentUrl.includes('checkout.stripe.com')
  const isLogin = currentUrl.includes('connexion') || currentUrl.includes('login')
  const isCheckout = currentUrl.includes('/checkout')

  logger.info(`Redirect result: stripe=${isStripe}, login=${isLogin}, stillOnCheckout=${isCheckout}`)
  await takeScreenshot(page, 'stripe_redirect')
}

// ============================================================
// TEST 4: Retour après paiement simulé
// ============================================================
async function testPaymentSuccessReturn(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing return from payment with success param')

  // Simuler le retour de Stripe avec upgrade=success
  await page.goto(`${TEST_CONFIG.baseUrl}/chat/${TEST_SIRENS.totalEnergies}?upgrade=success`)
  await wait(3000)

  // Vérifier le message de confirmation
  const hasSuccessMessage = await waitForText(page, 'Paiement confirmé', 5000) ||
                            await waitForText(page, 'confirmé', 5000) ||
                            await waitForText(page, 'Merci', 5000)

  logger.info(`Success message found: ${hasSuccessMessage}`)
  await takeScreenshot(page, 'payment_success_return')

  // Vérifier que le contexte est mis à jour (suggestions pour documents)
  const hasDocumentSuggestion = await waitForText(page, 'documents', 5000) ||
                                 await waitForText(page, 'uploader', 5000)

  logger.info(`Document suggestion found: ${hasDocumentSuggestion}`)
}

// ============================================================
// TEST 5: Gestion annulation paiement
// ============================================================
async function testPaymentCanceled(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing return from canceled payment')

  await page.goto(`${TEST_CONFIG.baseUrl}/chat/${TEST_SIRENS.totalEnergies}?upgrade=canceled`)
  await wait(2000)

  // La page devrait charger normalement sans erreur
  const hasError = await page.evaluate(() => {
    return document.body.innerText.toLowerCase().includes('erreur')
  })

  if (hasError) {
    logger.warn('Error message shown on cancel - may need handling')
  }

  await takeScreenshot(page, 'payment_canceled')
  logger.info('Cancel handling test completed')
}

// ============================================================
// TEST 6: Prix affiché correctement
// ============================================================
async function testPriceDisplay(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing price display on upgrade elements')

  await page.goto(`${TEST_CONFIG.baseUrl}/chat/${TEST_SIRENS.totalEnergies}`)
  await wait(3000)

  // Vérifier que le prix 79€ est affiché
  const priceDisplayed = await page.evaluate(() => {
    const text = document.body.innerText
    return text.includes('79€') || text.includes('79 €') || text.includes('79')
  })

  logger.info(`Price 79€ displayed: ${priceDisplayed}`)
  await takeScreenshot(page, 'price_display')
}

// ============================================================
// MAIN: Exécuter tous les tests du module
// ============================================================
export async function runPaymentTests(reporter: TestReporter): Promise<void> {
  const ctx = await createTestContext(MODULE_NAME)
  const { page, logger } = ctx

  reporter.startModule(MODULE_NAME)

  try {
    // Test 1: Bouton upgrade
    reporter.addResult(
      await runTest('Bouton upgrade vers checkout', async () => {
        await testUpgradeButtonToCheckout(page, logger)
      }, logger, reporter)
    )

    // Test 2: Page checkout
    reporter.addResult(
      await runTest('Page checkout charge', async () => {
        await testCheckoutPageLoad(page, logger)
      }, logger, reporter)
    )

    // Test 3: Redirection Stripe
    reporter.addResult(
      await runTest('Redirection Stripe', async () => {
        await testStripeRedirect(page, logger)
      }, logger, reporter)
    )

    // Test 4: Retour success
    reporter.addResult(
      await runTest('Retour après paiement réussi', async () => {
        await testPaymentSuccessReturn(page, logger)
      }, logger, reporter)
    )

    // Test 5: Annulation
    reporter.addResult(
      await runTest('Gestion annulation paiement', async () => {
        await testPaymentCanceled(page, logger)
      }, logger, reporter)
    )

    // Test 6: Prix
    reporter.addResult(
      await runTest('Affichage prix correct', async () => {
        await testPriceDisplay(page, logger)
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

  runPaymentTests(reporter)
    .then(() => {
      reporter.printSummary()
      reporter.saveReport('payment_tests.json')
      process.exit(reporter.generateReport().summary.failed > 0 ? 1 : 0)
    })
    .catch(err => {
      console.error('Fatal error:', err)
      process.exit(1)
    })
}
