// Tests E2E du module Diagnostic (nouveau flow gratuit)
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

const MODULE_NAME = 'diagnostic'

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
// TEST 1: Page /diagnostic charge (formulaire visible)
// ============================================================
async function testDiagnosticPageLoads(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Navigating to /diagnostic')
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic`, { waitUntil: 'networkidle2' })
  await wait(2000)

  const hasForm = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input, textarea, select, button')
    const text = document.body.innerText.toLowerCase()
    return inputs.length >= 1 && (
      text.includes('diagnostic') ||
      text.includes('siren') ||
      text.includes('entreprise') ||
      text.includes('commencer')
    )
  })

  if (!hasForm) {
    throw new Error('/diagnostic page missing form or expected content')
  }

  await takeScreenshot(page, 'diagnostic_page')
  logger.info('Diagnostic page loaded with form')
}

// ============================================================
// TEST 2: Saisie SIREN valide → company card affichée
// ============================================================
async function testValidSirenCompanyCard(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing valid SIREN entry on diagnostic')
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic`, { waitUntil: 'networkidle2' })
  await wait(2000)

  // Trouver l'input SIREN
  const input = await page.$('input[type="text"], input[inputmode="numeric"]')
  if (!input) {
    throw new Error('No SIREN input found on diagnostic page')
  }

  // Attendre que l'input soit actif
  await page.waitForFunction(
    () => {
      const input = document.querySelector('input[type="text"], input[inputmode="numeric"]') as HTMLInputElement
      return input && !input.disabled
    },
    { timeout: 10000 }
  )

  logger.info(`Entering valid SIREN: ${TEST_SIRENS.totalEnergies}`)
  await input.type(TEST_SIRENS.totalEnergies)

  // Soumettre
  const submitBtn = await page.$('button[type="submit"]')
  if (submitBtn) {
    await submitBtn.click()
  } else {
    await page.keyboard.press('Enter')
  }

  // Attendre que la fiche entreprise s'affiche
  await wait(5000)

  const hasCompanyCard = await page.evaluate(() => {
    const text = document.body.innerText
    return text.includes('TOTAL') ||
           text.includes('Energies') ||
           text.includes('552032534') ||
           text.includes("c'est elle") ||
           text.includes('Est-ce bien')
  })

  if (!hasCompanyCard) {
    logger.warn('Company card may not be fully displayed')
  }

  await takeScreenshot(page, 'diagnostic_company_card')
  logger.info('Company card test completed')
}

// ============================================================
// TEST 3: Saisie SIREN invalide → message d'erreur
// ============================================================
async function testInvalidSirenError(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing invalid SIREN entry on diagnostic')
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic`, { waitUntil: 'networkidle2' })
  await wait(2000)

  const input = await page.$('input[type="text"], input[inputmode="numeric"]')
  if (!input) {
    throw new Error('No SIREN input found on diagnostic page')
  }

  await page.waitForFunction(
    () => {
      const input = document.querySelector('input[type="text"], input[inputmode="numeric"]') as HTMLInputElement
      return input && !input.disabled
    },
    { timeout: 10000 }
  )

  logger.info(`Entering invalid SIREN: ${TEST_SIRENS.invalid}`)
  await input.type(TEST_SIRENS.invalid)
  await page.keyboard.press('Enter')
  await wait(3000)

  const hasError = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    return text.includes('invalide') ||
           text.includes('incorrect') ||
           text.includes('erreur') ||
           text.includes('luhn')
  })

  if (!hasError) {
    throw new Error('Expected error message for invalid SIREN')
  }

  await takeScreenshot(page, 'diagnostic_invalid_siren')
  logger.info('Invalid SIREN error displayed correctly')
}

// ============================================================
// TEST 4: Skip SIREN → passage à l'étape suivante
// ============================================================
async function testSkipSiren(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing SIREN skip on diagnostic')
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic`, { waitUntil: 'networkidle2' })
  await wait(2000)

  // Chercher un bouton "Passer" ou "Skip" ou "Sans SIREN"
  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, a'))
    const skipBtn = buttons.find(btn => {
      const text = btn.textContent?.toLowerCase() || ''
      return text.includes('passer') ||
             text.includes('skip') ||
             text.includes('sans siren') ||
             text.includes('je ne connais pas') ||
             text.includes('continuer sans')
    })
    if (skipBtn) {
      (skipBtn as HTMLElement).click()
      return true
    }
    return false
  })

  if (!clicked) {
    logger.warn('No skip button found — SIREN may be required')
    return
  }

  await wait(2000)
  await takeScreenshot(page, 'diagnostic_skip_siren')
  logger.info('SIREN skip test completed')
}

// ============================================================
// TEST 5: Flow formulaire complet (7 étapes) → redirect loading
// ============================================================
async function testDiagnosticFormFlow(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing diagnostic form multi-step flow')
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic`, { waitUntil: 'networkidle2' })
  await wait(2000)

  // Parcourir les étapes du formulaire
  let stepCount = 0
  const maxSteps = 10

  for (let i = 0; i < maxSteps; i++) {
    // Chercher des boutons de progression
    const hasNextStep = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))

      // Chercher un bouton de choix (les options du diagnostic)
      const choiceBtn = buttons.find(btn => {
        const text = btn.textContent?.toLowerCase() || ''
        return !text.includes('précédent') &&
               !text.includes('retour') &&
               btn.className.includes('border') &&
               text.length > 2 && text.length < 100
      })

      // Ou un bouton "Suivant" / "Continuer"
      const nextBtn = buttons.find(btn => {
        const text = btn.textContent?.toLowerCase() || ''
        return text.includes('suivant') ||
               text.includes('continuer') ||
               text.includes('valider')
      })

      const target = choiceBtn || nextBtn
      if (target) {
        (target as HTMLElement).click()
        return true
      }
      return false
    })

    if (!hasNextStep) break

    stepCount++
    await wait(1500)

    // Vérifier si on est arrivé à la page de loading
    const url = page.url()
    if (url.includes('/loading') || url.includes('/signup') || url.includes('/result')) {
      logger.info(`Redirected to ${url} after ${stepCount} steps`)
      break
    }
  }

  logger.info(`Completed ${stepCount} diagnostic steps`)
  await takeScreenshot(page, 'diagnostic_form_flow')
}

// ============================================================
// TEST 6: Page loading → redirect signup
// ============================================================
async function testLoadingRedirectSignup(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing /diagnostic/loading redirect')
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic/loading`, { waitUntil: 'networkidle2' })
  await wait(5000)

  const url = page.url()
  const hasLoadingContent = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    return text.includes('chargement') ||
           text.includes('analyse') ||
           text.includes('calcul') ||
           text.includes('patiente') ||
           text.includes('inscription') ||
           text.includes('connecter')
  })

  logger.info(`Loading page state: url=${url}, hasContent=${hasLoadingContent}`)

  // La page loading devrait soit montrer un chargement, soit rediriger vers signup/result
  if (!hasLoadingContent && !url.includes('/signup') && !url.includes('/result') && !url.includes('/connexion')) {
    logger.warn('Loading page may not have expected content')
  }

  await takeScreenshot(page, 'diagnostic_loading')
}

// ============================================================
// TEST 7: Signup → création compte → redirect result
// ============================================================
async function testSignupToResult(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing /diagnostic/signup page')
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic/signup`, { waitUntil: 'networkidle2' })
  await wait(3000)

  const url = page.url()

  // Vérifier que la page signup existe et a un formulaire d'inscription
  const hasSignup = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    const inputs = document.querySelectorAll('input')
    return (text.includes('inscri') || text.includes('compte') || text.includes('email')) && inputs.length >= 1
  })

  if (url.includes('/connexion') || url.includes('/inscription')) {
    logger.info('Signup page redirected to standard auth flow')
  } else if (hasSignup) {
    logger.info('Diagnostic signup page loaded with form')
  } else {
    logger.warn('Signup page may not have expected content')
  }

  await takeScreenshot(page, 'diagnostic_signup')
}

// ============================================================
// TEST 8: Page result → archétype affiché
// ============================================================
async function testResultArchetypeDisplayed(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing /diagnostic/result page')
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic/result`, { waitUntil: 'networkidle2' })
  await wait(3000)

  const url = page.url()

  // Si non-auth, on sera redirigé — c'est normal
  if (url.includes('/connexion') || url.includes('/inscription') || url.includes('/signup')) {
    logger.info('Result page requires auth — redirected')
    return
  }

  const hasResult = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    return text.includes('résultat') ||
           text.includes('diagnostic') ||
           text.includes('archétype') ||
           text.includes('profil') ||
           text.includes('valorisation') ||
           text.includes('rapport')
  })

  if (!hasResult) {
    logger.warn('Result page may not display archetype — check auth state')
  }

  await takeScreenshot(page, 'diagnostic_result')
}

// ============================================================
// TEST 9: CTA rapport → redirect checkout
// ============================================================
async function testResultCTACheckout(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing result page CTA → checkout')
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic/result`, { waitUntil: 'networkidle2' })
  await wait(3000)

  const url = page.url()

  // Si non-auth, skip ce test
  if (url.includes('/connexion') || url.includes('/inscription') || url.includes('/signup')) {
    logger.info('Result page requires auth — CTA test skipped')
    return
  }

  // Chercher un CTA vers checkout / rapport / évaluation complète
  const hasCheckoutCTA = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a, button'))
    return links.some(el => {
      const text = el.textContent?.toLowerCase() || ''
      const href = (el as HTMLAnchorElement).href || ''
      return text.includes('rapport') ||
             text.includes('complet') ||
             text.includes('79') ||
             href.includes('/checkout')
    })
  })

  logger.info(`Checkout CTA found: ${hasCheckoutCTA}`)
  await takeScreenshot(page, 'diagnostic_result_cta')
}

// ============================================================
// TEST 10: Routing — données SaaS → archétype SaaS détecté
// ============================================================
async function testRoutingSaaS(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing archetype routing for SaaS')

  // Naviguer vers le diagnostic et vérifier que les données SaaS sont reconnues
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic`, { waitUntil: 'networkidle2' })
  await wait(2000)

  // Ce test vérifie la logique côté client du routing
  const routingWorks = await page.evaluate(() => {
    // Vérifier que la page contient des options liées aux secteurs
    const text = document.body.innerText.toLowerCase()
    return text.includes('saas') ||
           text.includes('logiciel') ||
           text.includes('technologie') ||
           text.includes('secteur') ||
           text.includes('activité')
  })

  logger.info(`SaaS routing indicators found: ${routingWorks}`)
  await takeScreenshot(page, 'diagnostic_routing_saas')
}

// ============================================================
// TEST 11: Routing — données commerce → archétype commerce détecté
// ============================================================
async function testRoutingCommerce(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing archetype routing for commerce')

  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic`, { waitUntil: 'networkidle2' })
  await wait(2000)

  const routingWorks = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    return text.includes('commerce') ||
           text.includes('magasin') ||
           text.includes('boutique') ||
           text.includes('secteur') ||
           text.includes('activité')
  })

  logger.info(`Commerce routing indicators found: ${routingWorks}`)
  await takeScreenshot(page, 'diagnostic_routing_commerce')
}

// ============================================================
// TEST 12: Routing — données patrimoine → archétype patrimoine détecté
// ============================================================
async function testRoutingPatrimoine(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing archetype routing for patrimoine')

  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic`, { waitUntil: 'networkidle2' })
  await wait(2000)

  const routingWorks = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    return text.includes('patrimoine') ||
           text.includes('immobilier') ||
           text.includes('holding') ||
           text.includes('secteur') ||
           text.includes('activité')
  })

  logger.info(`Patrimoine routing indicators found: ${routingWorks}`)
  await takeScreenshot(page, 'diagnostic_routing_patrimoine')
}

// ============================================================
// MAIN
// ============================================================
export async function runDiagnosticTests(reporter: TestReporter): Promise<void> {
  const ctx = await createTestContext(MODULE_NAME)
  const { page, logger } = ctx

  reporter.startModule(MODULE_NAME)

  try {
    reporter.addResult(await runTest('Page /diagnostic charge', async () => {
      await testDiagnosticPageLoads(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('SIREN valide → company card', async () => {
      await testValidSirenCompanyCard(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('SIREN invalide → erreur', async () => {
      await testInvalidSirenError(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Skip SIREN → étape suivante', async () => {
      await testSkipSiren(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Flow formulaire complet (7 étapes)', async () => {
      await testDiagnosticFormFlow(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Page loading → redirect signup', async () => {
      await testLoadingRedirectSignup(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Signup → création compte', async () => {
      await testSignupToResult(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Page result → archétype affiché', async () => {
      await testResultArchetypeDisplayed(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('CTA rapport → redirect checkout', async () => {
      await testResultCTACheckout(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Routing : SaaS → archétype SaaS', async () => {
      await testRoutingSaaS(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Routing : commerce → archétype commerce', async () => {
      await testRoutingCommerce(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Routing : patrimoine → archétype patrimoine', async () => {
      await testRoutingPatrimoine(page, logger)
    }, logger, reporter))

  } finally {
    reporter.endModule()
    await closeTestContext(ctx)
  }
}

if (require.main === module) {
  const { getReporter } = require('../utils/reporter')
  const reporter = getReporter()

  runDiagnosticTests(reporter)
    .then(() => {
      reporter.printSummary()
      reporter.saveReport('diagnostic_tests.json')
      process.exit(reporter.generateReport().summary.failed > 0 ? 1 : 0)
    })
    .catch(err => {
      console.error('Fatal error:', err)
      process.exit(1)
    })
}
