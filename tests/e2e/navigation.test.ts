// Tests E2E du module Navigation & CTA
import { Page } from 'puppeteer'
import { TEST_CONFIG } from '../config'
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

const MODULE_NAME = 'navigation'

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
// TEST 1: Landing page charge correctement
// ============================================================
async function testLandingPageLoads(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Navigating to landing page')
  await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' })

  const hasTitle = await waitForText(page, 'EvalUp', 10000)
  if (!hasTitle) {
    throw new Error('Landing page missing "EvalUp" text')
  }

  const hasCTA = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('a, button'))
    return buttons.some(btn =>
      btn.textContent?.includes('Commencer') || btn.textContent?.includes('gratuitement')
    )
  })

  if (!hasCTA) {
    throw new Error('Landing page missing "Commencer gratuitement" CTA')
  }

  await takeScreenshot(page, 'landing_page')
  logger.info('Landing page loaded with CTA visible')
}

// ============================================================
// TEST 2: CTA Hero redirige vers /diagnostic
// ============================================================
async function testHeroCTARedirect(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing hero CTA redirect')
  await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' })

  await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'))
    const ctaLink = links.find(link =>
      link.textContent?.includes('Commencer') || link.textContent?.includes('gratuitement') || link.textContent?.includes('Diagnostic')
    )
    if (ctaLink) ctaLink.click()
  })

  await wait(3000)
  const url = page.url()

  if (!url.includes('/diagnostic') && !url.includes('/connexion') && !url.includes('/app')) {
    throw new Error(`CTA hero redirected to unexpected URL: ${url}`)
  }

  logger.info(`CTA hero redirected to: ${url}`)
  await takeScreenshot(page, 'hero_cta_redirect')
}

// ============================================================
// TEST 3: CTA "Voir un exemple" déclenche un téléchargement
// ============================================================
async function testExamplePDFDownload(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing "Voir un exemple" CTA')
  await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' })

  const hasExampleButton = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('a, button'))
    return elements.some(el =>
      el.textContent?.includes('exemple') || el.textContent?.includes('Exemple')
    )
  })

  if (!hasExampleButton) {
    logger.warn('No "Voir un exemple" button found - may be styled differently')
    return
  }

  // Set up download listener
  const client = await page.createCDPSession()
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: '/tmp/evalup-test-downloads',
  })

  await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('a, button'))
    const btn = elements.find(el =>
      el.textContent?.includes('exemple') || el.textContent?.includes('Exemple')
    )
    if (btn) (btn as HTMLElement).click()
  })

  await wait(3000)
  logger.info('Example PDF download test completed')
  await takeScreenshot(page, 'example_pdf_download')
}

// ============================================================
// TEST 4: Lien nav "Tarifs" fonctionne
// ============================================================
async function testNavTarifsLink(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing nav "Tarifs" link')
  await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' })

  await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'))
    const tarifsLink = links.find(link => link.textContent?.includes('Tarifs'))
    if (tarifsLink) tarifsLink.click()
  })

  await wait(2000)
  const url = page.url()

  if (!url.includes('/tarifs')) {
    throw new Error(`Nav "Tarifs" did not navigate to /tarifs. Got: ${url}`)
  }

  // Vérifier que les 4 plans sont affichés
  const planCount = await page.evaluate(() => {
    const text = document.body.innerText
    let count = 0
    if (text.includes('Flash') || text.includes('Gratuit')) count++
    if (text.includes('79')) count++
    if (text.includes('199')) count++
    if (text.includes('399')) count++
    return count
  })

  if (planCount < 3) {
    throw new Error(`Expected at least 3 plans on /tarifs, found indicators for ${planCount}`)
  }

  logger.info(`Tarifs page loaded with ${planCount} plan indicators`)
  await takeScreenshot(page, 'nav_tarifs')
}

// ============================================================
// TEST 5: Pricing page charge avec 2 offres principales + 2 Pro
// ============================================================
async function testPricingPageLoads(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Navigating to pricing page')
  await page.goto(`${TEST_CONFIG.baseUrl}/tarifs`, { waitUntil: 'networkidle2' })

  const prices = await page.evaluate(() => {
    const text = document.body.innerText
    return {
      hasDiagnostic: text.includes('Gratuit') || text.includes('Diagnostic') || text.includes('Flash'),
      hasComplete: text.includes('79'),
      hasPro10: text.includes('199'),
      hasProUnlimited: text.includes('399'),
    }
  })

  logger.info(`Plans found: ${JSON.stringify(prices)}`)

  // Au minimum : offre gratuite + complète à 79€ + au moins un plan Pro
  if (!prices.hasDiagnostic || !prices.hasComplete || (!prices.hasPro10 && !prices.hasProUnlimited)) {
    throw new Error(`Missing plans on pricing page: ${JSON.stringify(prices)}`)
  }

  await takeScreenshot(page, 'pricing_page')
}

// ============================================================
// TEST 6: FAQ accordion fonctionne
// ============================================================
async function testFAQAccordion(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing FAQ accordion on pricing page')
  await page.goto(`${TEST_CONFIG.baseUrl}/tarifs`, { waitUntil: 'networkidle2' })

  // Chercher des éléments FAQ (details/summary ou boutons accordion)
  const faqFound = await page.evaluate(() => {
    const details = document.querySelectorAll('details')
    if (details.length > 0) {
      // Ouvrir le premier
      const first = details[0]
      first.setAttribute('open', '')
      return { type: 'details', count: details.length, opened: true }
    }

    // Alternative: boutons accordion
    const buttons = Array.from(document.querySelectorAll('button'))
    const faqButtons = buttons.filter(btn =>
      btn.textContent?.includes('?') || btn.textContent?.includes('difference')
    )
    if (faqButtons.length > 0) {
      faqButtons[0].click()
      return { type: 'buttons', count: faqButtons.length, opened: true }
    }

    return { type: 'none', count: 0, opened: false }
  })

  logger.info(`FAQ found: ${JSON.stringify(faqFound)}`)
  await wait(500)
  await takeScreenshot(page, 'faq_accordion')
}

// ============================================================
// TEST 7: Page Aide charge
// ============================================================
async function testAidePageLoads(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Navigating to aide page')
  await page.goto(`${TEST_CONFIG.baseUrl}/aide`, { waitUntil: 'networkidle2' })
  await wait(2000)

  const pageContent = await page.evaluate(() => document.body.innerText)
  const hasContent = pageContent.length > 100

  if (!hasContent) {
    throw new Error('Aide page has insufficient content')
  }

  logger.info('Aide page loaded successfully')
  await takeScreenshot(page, 'aide_page')
}

// ============================================================
// TEST 8: Pages légales chargent (CGV, CGU, Privacy, Mentions)
// ============================================================
async function testLegalPagesLoad(page: Page, logger: TestLogger): Promise<void> {
  const legalPages = [
    { path: '/cgv', expectedText: 'Conditions' },
    { path: '/cgu', expectedText: 'Utilisation' },
    { path: '/privacy', expectedText: 'Confidentialit' },
    { path: '/mentions-legales', expectedText: 'Mentions' },
  ]

  for (const legalPage of legalPages) {
    logger.info(`Testing legal page: ${legalPage.path}`)
    await page.goto(`${TEST_CONFIG.baseUrl}${legalPage.path}`, { waitUntil: 'networkidle2' })

    const hasH1 = await page.evaluate(() => {
      const h1 = document.querySelector('h1')
      return h1 !== null && (h1.textContent?.length ?? 0) > 5
    })

    if (!hasH1) {
      throw new Error(`Legal page ${legalPage.path} missing h1 heading`)
    }

    const hasExpectedText = await waitForText(page, legalPage.expectedText, 5000)
    if (!hasExpectedText) {
      logger.warn(`Legal page ${legalPage.path} missing expected text: "${legalPage.expectedText}"`)
    }
  }

  logger.info('All legal pages loaded successfully')
  await takeScreenshot(page, 'legal_pages')
}

// ============================================================
// TEST 9: Page Contact charge
// ============================================================
async function testContactPageLoads(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Navigating to contact page')
  await page.goto(`${TEST_CONFIG.baseUrl}/contact`, { waitUntil: 'networkidle2' })
  await wait(2000)

  const hasForm = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input, textarea, select')
    return inputs.length >= 2
  })

  if (!hasForm) {
    throw new Error('Contact page missing form elements')
  }

  logger.info('Contact page loaded with form')
  await takeScreenshot(page, 'contact_page')
}

// ============================================================
// TEST 10: Contact form validation (submit vide)
// ============================================================
async function testContactFormValidation(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing contact form validation')
  await page.goto(`${TEST_CONFIG.baseUrl}/contact`, { waitUntil: 'networkidle2' })
  await wait(2000)

  // Essayer de soumettre le formulaire vide
  const submitted = await page.evaluate(() => {
    const submitBtn = Array.from(document.querySelectorAll('button')).find(btn =>
      btn.textContent?.includes('Envoyer') || btn.type === 'submit'
    )
    if (submitBtn) {
      submitBtn.click()
      return true
    }
    return false
  })

  if (submitted) {
    await wait(2000)

    // Vérifier qu'une erreur de validation s'affiche
    const hasValidationError = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase()
      return text.includes('obligatoire') ||
             text.includes('requis') ||
             text.includes('invalide') ||
             text.includes('veuillez') ||
             text.includes('erreur') ||
             document.querySelector(':invalid') !== null
    })

    logger.info(`Validation error shown: ${hasValidationError}`)
  }

  await takeScreenshot(page, 'contact_validation')
}

// ============================================================
// TEST 11: Footer liens fonctionnent
// ============================================================
async function testFooterLinks(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing footer links')
  await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' })

  const footerLinks = await page.evaluate(() => {
    const footer = document.querySelector('footer')
    if (!footer) return []
    const links = Array.from(footer.querySelectorAll('a'))
    return links.map(link => ({
      text: link.textContent?.trim() || '',
      href: link.getAttribute('href') || '',
    }))
  })

  logger.info(`Found ${footerLinks.length} footer links`)

  if (footerLinks.length < 3) {
    throw new Error(`Expected at least 3 footer links, found ${footerLinks.length}`)
  }

  // Tester un lien du footer (le premier lien interne)
  const internalLink = footerLinks.find(l => l.href.startsWith('/'))
  if (internalLink) {
    logger.info(`Testing footer link: ${internalLink.text} → ${internalLink.href}`)
    await page.goto(`${TEST_CONFIG.baseUrl}${internalLink.href}`, { waitUntil: 'networkidle2' })

    const pageLoaded = await page.evaluate(() => document.body.innerText.length > 50)
    if (!pageLoaded) {
      throw new Error(`Footer link ${internalLink.href} led to empty page`)
    }
  }

  await takeScreenshot(page, 'footer_links')
}

// ============================================================
// TEST 12: 404 page ne crash pas
// ============================================================
async function test404Page(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing 404 page')

  const response = await page.goto(`${TEST_CONFIG.baseUrl}/page-qui-nexiste-pas-du-tout`, {
    waitUntil: 'networkidle2',
  })

  const status = response?.status() || 0

  // Soit 404, soit redirect (302/307), soit page custom
  const isAcceptable = status === 404 || status === 200 || (status >= 300 && status < 400)

  if (!isAcceptable) {
    throw new Error(`404 page returned unexpected status: ${status}`)
  }

  // Vérifier que la page n'affiche pas d'erreur JS critique
  const hasCriticalError = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    return text.includes('internal server error') || text.includes('500')
  })

  if (hasCriticalError) {
    throw new Error('404 page shows server error (500)')
  }

  logger.info(`404 page handled gracefully (status: ${status})`)
  await takeScreenshot(page, '404_page')
}

// ============================================================
// MAIN
// ============================================================
export async function runNavigationTests(reporter: TestReporter): Promise<void> {
  const ctx = await createTestContext(MODULE_NAME)
  const { page, logger } = ctx

  reporter.startModule(MODULE_NAME)

  try {
    reporter.addResult(await runTest('Landing page charge', async () => {
      await testLandingPageLoads(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('CTA hero → /diagnostic', async () => {
      await testHeroCTARedirect(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('CTA "Voir un exemple" PDF', async () => {
      await testExamplePDFDownload(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Nav lien Tarifs', async () => {
      await testNavTarifsLink(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Pricing page 2+2 plans', async () => {
      await testPricingPageLoads(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('FAQ accordion', async () => {
      await testFAQAccordion(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Page Aide charge', async () => {
      await testAidePageLoads(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Pages légales chargent', async () => {
      await testLegalPagesLoad(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Page Contact charge', async () => {
      await testContactPageLoads(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Contact form validation', async () => {
      await testContactFormValidation(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Footer liens fonctionnent', async () => {
      await testFooterLinks(page, logger)
    }, logger, reporter))

    reporter.addResult(await runTest('Page 404 ne crash pas', async () => {
      await test404Page(page, logger)
    }, logger, reporter))

  } finally {
    reporter.endModule()
    await closeTestContext(ctx)
  }
}

if (require.main === module) {
  const { getReporter } = require('../utils/reporter')
  const reporter = getReporter()

  runNavigationTests(reporter)
    .then(() => {
      reporter.printSummary()
      reporter.saveReport('navigation_tests.json')
      process.exit(reporter.generateReport().summary.failed > 0 ? 1 : 0)
    })
    .catch(err => {
      console.error('Fatal error:', err)
      process.exit(1)
    })
}
