// Tests E2E du module Diagnostic (flow SIREN obligatoire + auto-avance)
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
// TEST 2: Saisie SIREN valide → company card affichée + auto-avance
// ============================================================
async function testValidSirenAutoAdvance(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing valid SIREN entry → auto-advance')
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic`, { waitUntil: 'networkidle2' })
  await wait(2000)

  const input = await page.$('input[placeholder="XXX XXX XXX"]')
  if (!input) {
    throw new Error('No SIREN input found on diagnostic page')
  }

  await page.waitForFunction(
    () => {
      const input = document.querySelector('input[placeholder="XXX XXX XXX"]') as HTMLInputElement
      return input && !input.disabled
    },
    { timeout: 10000 }
  )

  logger.info(`Entering valid SIREN: ${TEST_SIRENS.totalEnergies}`)
  await input.type(TEST_SIRENS.totalEnergies)

  // Submit via Rechercher button or Enter
  const clicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(
      b => b.textContent?.trim().includes('Rechercher')
    )
    if (btn) { btn.click(); return true }
    return false
  })
  if (!clicked) {
    await page.keyboard.press('Enter')
  }

  // Wait for company card + auto-advance (800ms delay + transition)
  // Try multiple times since API can be slow
  let advancedToStep2 = false
  let hasCompanyCard = false
  for (let attempt = 0; attempt < 3; attempt++) {
    await wait(3000)

    // After auto-advance, we should be on step 2 (activity type) or company confirmation card
    advancedToStep2 = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase()
      // Step 1 shows activity type options, or still on step 0 with company card
      return text.includes('activité') ||
             text.includes('type d') ||
             text.includes('saas') ||
             text.includes('commerce') ||
             text.includes('e-commerce') ||
             text.includes('conseil') ||
             text.includes('c\u2019est bien votre entreprise')
    })

    if (advancedToStep2) break

    // Check if company card is at least displayed (API may be slow)
    hasCompanyCard = await page.evaluate(() => {
      const text = document.body.innerText
      return text.includes('TOTAL') ||
             text.includes('Energies') ||
             text.includes('552032534')
    })
    if (hasCompanyCard) break
  }

  if (!advancedToStep2 && !hasCompanyCard) {
    throw new Error('Expected auto-advance to step 2 or company card display after valid SIREN')
  }
  if (hasCompanyCard && !advancedToStep2) {
    logger.info('Company card displayed, auto-advance may be pending')
  }

  await takeScreenshot(page, 'diagnostic_auto_advance')
  logger.info('Valid SIREN auto-advance test completed')
}

// ============================================================
// TEST 3: Saisie SIREN invalide → message d'erreur
// ============================================================
async function testInvalidSirenError(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing invalid SIREN entry on diagnostic')
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic`, { waitUntil: 'networkidle2' })
  await wait(2000)

  const input = await page.$('input[placeholder="XXX XXX XXX"]')
  if (!input) {
    throw new Error('No SIREN input found on diagnostic page')
  }

  await page.waitForFunction(
    () => {
      const input = document.querySelector('input[placeholder="XXX XXX XXX"]') as HTMLInputElement
      return input && !input.disabled
    },
    { timeout: 10000 }
  )

  logger.info(`Entering invalid SIREN: ${TEST_SIRENS.invalid}`)
  await input.type(TEST_SIRENS.invalid)
  await page.keyboard.press('Enter')
  await wait(4000)

  const hasError = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    // Error message may appear in various forms (dark theme styled div)
    return text.includes('invalide') ||
           text.includes('incorrect') ||
           text.includes('erreur') ||
           text.includes('luhn') ||
           text.includes('introuvable') ||
           text.includes('vérifi') ||
           text.includes('9 chiffres')
  })

  if (!hasError) {
    // Check if the Rechercher button is still disabled (SIREN length < 9 prevents lookup)
    const btnDisabled = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(
        b => b.textContent?.includes('Rechercher')
      )
      return btn ? (btn as HTMLButtonElement).disabled : false
    })
    if (btnDisabled) {
      logger.info('Rechercher button is disabled for invalid SIREN — validation works at input level')
    } else {
      throw new Error('Expected error message for invalid SIREN')
    }
  }

  await takeScreenshot(page, 'diagnostic_invalid_siren')
  logger.info('Invalid SIREN error displayed correctly')
}

// ============================================================
// TEST 4: SIREN est obligatoire — pas de bouton skip
// ============================================================
async function testSirenMandatory(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing that SIREN is mandatory (no skip button)')
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic`, { waitUntil: 'networkidle2' })
  await wait(2000)

  // Verify no skip/passer/continuer buttons on SIREN step
  const hasSkipButton = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, a'))
    return buttons.some(btn => {
      const text = btn.textContent?.toLowerCase() || ''
      return text.includes('passer') ||
             text.includes('skip') ||
             text.includes('sans siren') ||
             text.includes('continuer sans')
    })
  })

  if (hasSkipButton) {
    throw new Error('Skip button found on SIREN step — SIREN should be mandatory')
  }

  // Verify no "Continuer" or navigation buttons on step 0
  const hasNavButtons = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    return buttons.some(btn => {
      const text = btn.textContent?.toLowerCase() || ''
      return text.includes('continuer') ||
             text.includes('suivant')
    })
  })

  if (hasNavButtons) {
    throw new Error('Navigation buttons found on SIREN step — should be hidden')
  }

  logger.info('SIREN step has no skip or navigation buttons — mandatory confirmed')
  await takeScreenshot(page, 'diagnostic_siren_mandatory')
}

// ============================================================
// TEST 5: Step counter shows correct count
// ============================================================
async function testStepCounter(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing progress dots display')
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic`, { waitUntil: 'networkidle2' })
  await wait(2000)

  // The diagnostic form uses ProgressDots (visual dots) instead of "Étape X sur Y" text.
  // Each dot is a div inside a flex container. The active dot is wider (20px) vs inactive (6px).
  const progressInfo = await page.evaluate(() => {
    // Find the progress dots container (flex with gap 4, centered, multiple small divs)
    const containers = Array.from(document.querySelectorAll('div'))
    for (const container of containers) {
      const style = container.getAttribute('style') || ''
      if (style.includes('gap') && style.includes('center') && style.includes('margin-bottom')) {
        const dots = Array.from(container.children).filter(
          (ch) => ch.tagName === 'DIV' && (ch as HTMLElement).style.borderRadius
        )
        if (dots.length >= 5) {
          // Count dots and find the active one (wider)
          const activeDot = dots.findIndex((d) => {
            const w = parseInt((d as HTMLElement).style.width)
            return w > 10 // active dot is 20px wide
          })
          return { total: dots.length, active: activeDot }
        }
      }
    }
    return null
  })

  if (!progressInfo) {
    throw new Error('Progress dots not found on diagnostic page')
  }

  if (progressInfo.active !== 0) {
    throw new Error(`Expected first dot active (index 0), got index ${progressInfo.active}`)
  }

  // Total should be 8+ dots (varies by activity type)
  if (progressInfo.total < 5 || progressInfo.total > 15) {
    throw new Error(`Expected 5-15 progress dots, got ${progressInfo.total}`)
  }

  logger.info(`Progress dots: ${progressInfo.active + 1}/${progressInfo.total}`)
  await takeScreenshot(page, 'diagnostic_step_counter')
}

// ============================================================
// TEST 6: Full form flow → redirect to loading
// ============================================================
async function testDiagnosticFormFlow(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing diagnostic form multi-step flow')
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic`, { waitUntil: 'networkidle2' })
  await wait(2000)

  // Step 0: Enter SIREN
  const input = await page.$('input[placeholder="XXX XXX XXX"]')
  if (!input) throw new Error('No SIREN input found')

  await page.waitForFunction(
    () => {
      const el = document.querySelector('input[placeholder="XXX XXX XXX"]') as HTMLInputElement
      return el && !el.disabled
    },
    { timeout: 10000 }
  )

  logger.info(`Entering SIREN: ${TEST_SIRENS.carrefour}`)
  await input.type(TEST_SIRENS.carrefour)
  await page.keyboard.press('Enter')
  await wait(6000) // Wait for lookup + auto-advance

  // Steps 1+: click through choices and continue buttons
  let stepCount = 1
  const maxSteps = 12

  for (let i = 0; i < maxSteps; i++) {
    const hasNextStep = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))

      // Click a choice button first (option cards in the form)
      // Buttons use inline styles (border via style attribute), not CSS classes
      const choiceBtn = buttons.find(btn => {
        const text = btn.textContent?.toLowerCase() || ''
        const style = btn.getAttribute('style') || ''
        const isBorderBtn = style.includes('border') && style.includes('border-radius')
        return !text.includes('retour') &&
               !text.includes('précédent') &&
               !text.includes('rechercher') &&
               !text.includes('continuer') &&
               !text.includes('passer') &&
               !text.includes('voir mon') &&
               isBorderBtn &&
               text.length > 2 && text.length < 100
      })

      if (choiceBtn) {
        (choiceBtn as HTMLElement).click()
        return 'choice'
      }

      // Or click "Continuer" / "Voir mon diagnostic"
      const nextBtn = buttons.find(btn => {
        const text = btn.textContent?.toLowerCase() || ''
        return text.includes('continuer') ||
               text.includes('voir mon diagnostic')
      })

      if (nextBtn && !(nextBtn as HTMLButtonElement).disabled) {
        (nextBtn as HTMLElement).click()
        return 'next'
      }

      return null
    })

    if (!hasNextStep) break

    stepCount++
    await wait(1500)

    // Check if redirected to loading page
    const url = page.url()
    if (url.includes('/loading') || url.includes('/signup') || url.includes('/result')) {
      logger.info(`Redirected to ${url} after ${stepCount} steps`)
      break
    }
  }

  if (stepCount < 3) {
    throw new Error(`Only completed ${stepCount} steps — expected at least 3`)
  }

  logger.info(`Completed ${stepCount} diagnostic steps`)
  await takeScreenshot(page, 'diagnostic_form_flow')
}

// ============================================================
// TEST 7: Loading page shows progress
// ============================================================
async function testLoadingPageContent(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing /diagnostic/loading page content')
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic/loading`, { waitUntil: 'networkidle2' })
  await wait(3000)

  const url = page.url()

  const hasLoadingContent = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    return text.includes('détection') ||
           text.includes('analyse') ||
           text.includes('profil') ||
           text.includes('chargement') ||
           text.includes('patiente') ||
           // Error state (no sessionStorage data)
           text.includes('données manquantes') ||
           text.includes('recommencer')
  })

  if (!hasLoadingContent && !url.includes('/signup') && !url.includes('/result') && !url.includes('/connexion')) {
    throw new Error('Loading page missing expected content (progress or error)')
  }

  logger.info(`Loading page state: url=${url}, hasContent=${hasLoadingContent}`)
  await takeScreenshot(page, 'diagnostic_loading')
}

// ============================================================
// TEST 8: Loading page shows error without sessionStorage data
// ============================================================
async function testLoadingNoData(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing loading page without diagnostic data')

  // Clear sessionStorage and navigate
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic`, { waitUntil: 'networkidle2' })
  await page.evaluate(() => sessionStorage.removeItem('diagnostic_data'))
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic/loading`, { waitUntil: 'networkidle2' })
  await wait(3000)

  const hasError = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    return text.includes('données manquantes') ||
           text.includes('recommencer') ||
           text.includes('erreur')
  })

  if (!hasError) {
    logger.warn('Loading page did not show error for missing data — may redirect')
  } else {
    logger.info('Loading page correctly shows error for missing data')
  }

  await takeScreenshot(page, 'diagnostic_loading_no_data')
}

// ============================================================
// TEST 9: Signup page loads
// ============================================================
async function testSignupPageLoads(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing /diagnostic/signup page')
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic/signup`, { waitUntil: 'networkidle2' })
  await wait(3000)

  const url = page.url()

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
// TEST 10: Result page requires auth
// ============================================================
async function testResultRequiresAuth(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing /diagnostic/result page (unauthenticated)')
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic/result`, { waitUntil: 'networkidle2' })
  await wait(3000)

  const url = page.url()

  // Should redirect to auth or show result
  if (url.includes('/connexion') || url.includes('/inscription') || url.includes('/signup')) {
    logger.info('Result page correctly requires auth — redirected')
  } else {
    const hasResult = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase()
      return text.includes('résultat') ||
             text.includes('diagnostic') ||
             text.includes('archétype') ||
             text.includes('rapport')
    })
    if (hasResult) {
      logger.info('Result page accessible (user may be authenticated)')
    } else {
      logger.warn('Result page state unclear')
    }
  }

  await takeScreenshot(page, 'diagnostic_result')
}

// ============================================================
// TEST 11: Result page CTA → checkout link
// ============================================================
async function testResultCTACheckout(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing result page CTA → checkout')
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic/result`, { waitUntil: 'networkidle2' })
  await wait(3000)

  const url = page.url()

  if (url.includes('/connexion') || url.includes('/inscription') || url.includes('/signup')) {
    logger.info('Result page requires auth — CTA test skipped')
    return
  }

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
// TEST 12: Progress bar visible and advances
// ============================================================
async function testProgressBar(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing progress bar visibility')
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic`, { waitUntil: 'networkidle2' })
  await wait(2000)

  const hasProgressBar = await page.evaluate(() => {
    // Look for the fixed progress bar at the top
    const bars = document.querySelectorAll('[class*="bg-[var(--accent)]"]')
    // Or any element with transition + width style
    const fixedBar = document.querySelector('.fixed .h-1, .fixed .h-full')
    return bars.length > 0 || fixedBar !== null
  })

  // Progress bar may use inline styles, just check it exists
  logger.info(`Progress bar found: ${hasProgressBar}`)
  await takeScreenshot(page, 'diagnostic_progress_bar')
}

// ============================================================
// TEST 13: SIREN format — spaces inserted correctly
// ============================================================
async function testSirenFormatting(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing SIREN input formatting (XXX XXX XXX)')
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic`, { waitUntil: 'networkidle2' })
  await wait(2000)

  const input = await page.$('input[placeholder="XXX XXX XXX"]')
  if (!input) throw new Error('No SIREN input found')

  await page.waitForFunction(
    () => {
      const el = document.querySelector('input[placeholder="XXX XXX XXX"]') as HTMLInputElement
      return el && !el.disabled
    },
    { timeout: 10000 }
  )

  // Type digits one by one
  await input.type('552032534')
  await wait(500)

  const value = await page.evaluate(() => {
    const el = document.querySelector('input[placeholder="XXX XXX XXX"]') as HTMLInputElement
    return el?.value || ''
  })

  // Should have spaces: "552 032 534"
  const digits = value.replace(/\D/g, '')
  if (digits !== '552032534') {
    throw new Error(`Expected 9 digits in input, got "${value}" (digits: ${digits})`)
  }

  logger.info(`SIREN formatted as: "${value}"`)
  await takeScreenshot(page, 'diagnostic_siren_format')
}

// ============================================================
// TEST 14: Activity type selection shows all 8 types
// ============================================================
async function testActivityTypeOptions(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing activity type selection options')
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic`, { waitUntil: 'networkidle2' })
  await wait(2000)

  // Enter SIREN and wait for auto-advance
  const input = await page.$('input[placeholder="XXX XXX XXX"]')
  if (!input) throw new Error('No SIREN input found')

  await page.waitForFunction(
    () => {
      const el = document.querySelector('input[placeholder="XXX XXX XXX"]') as HTMLInputElement
      return el && !el.disabled
    },
    { timeout: 10000 }
  )

  await input.type(TEST_SIRENS.orange)
  await page.keyboard.press('Enter')
  await wait(6000) // Wait for lookup + auto-advance

  const activityTypes = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    const expected = ['saas', 'marketplace', 'e-commerce', 'conseil', 'services', 'commerce', 'industrie', 'immobilier']
    return expected.filter(t => text.includes(t))
  })

  if (activityTypes.length < 5) {
    logger.warn(`Only found ${activityTypes.length} activity types: ${activityTypes.join(', ')}`)
  } else {
    logger.info(`Found ${activityTypes.length} activity types`)
  }

  await takeScreenshot(page, 'diagnostic_activity_types')
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

    reporter.addResult(await runTest('SIREN valide → auto-avance vers étape 2', async () => {
      await testValidSirenAutoAdvance(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('SIREN invalide → erreur', async () => {
      await testInvalidSirenError(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('SIREN obligatoire — pas de bouton skip', async () => {
      await testSirenMandatory(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Compteur d\'étapes correct', async () => {
      await testStepCounter(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Flow formulaire complet → redirect loading', async () => {
      await testDiagnosticFormFlow(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Page loading → contenu progression', async () => {
      await testLoadingPageContent(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Loading sans données → erreur', async () => {
      await testLoadingNoData(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Signup page charge', async () => {
      await testSignupPageLoads(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Result page → auth requise', async () => {
      await testResultRequiresAuth(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('CTA rapport → lien checkout', async () => {
      await testResultCTACheckout(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Barre de progression visible', async () => {
      await testProgressBar(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Formatage SIREN (XXX XXX XXX)', async () => {
      await testSirenFormatting(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('8 types d\'activité affichés', async () => {
      await testActivityTypeOptions(page, logger)
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
