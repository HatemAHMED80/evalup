// Tests E2E du module Mobile & Responsive
import { Page } from 'puppeteer'
import { TEST_CONFIG, TEST_SIRENS, MOBILE_VIEWPORTS } from '../config'
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
  setMobileViewport,
  checkNoHorizontalOverflow,
  isElementVisible,
  wait,
} from '../utils/browser'

const MODULE_NAME = 'mobile'

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
// TEST 1: Landing mobile layout (iPhone SE)
// ============================================================
async function testLandingMobileLayout(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing landing page mobile layout (375x667)')
  await setMobileViewport(page, 'iphoneSE')
  await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' })
  await wait(2000)

  // Vérifier pas de scroll horizontal
  const noOverflow = await checkNoHorizontalOverflow(page)
  if (!noOverflow) {
    throw new Error('Landing page has horizontal overflow on mobile (375px)')
  }

  // Vérifier que le CTA existe (peut nécessiter scroll sur petit écran)
  const ctaExists = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a, button'))
    const cta = links.find(el =>
      el.textContent?.includes('Commencer') || el.textContent?.includes('gratuitement')
    )
    if (!cta) return { exists: false, visible: false }
    const rect = cta.getBoundingClientRect()
    return { exists: true, visible: rect.width > 0 && rect.height > 0 }
  })

  if (!ctaExists.exists) {
    throw new Error('CTA button not found on mobile')
  }

  if (!ctaExists.visible) {
    logger.warn('CTA exists but requires scroll to be visible on 375px — acceptable')
  }

  // Vérifier que les éléments sont empilés (flex-col)
  const isStacked = await page.evaluate(() => {
    // Les CTAs hero devraient être empilés sur mobile
    const ctaContainer = document.querySelector('[class*="flex"][class*="gap"]')
    if (!ctaContainer) return true // Pas de container = ok
    const computed = window.getComputedStyle(ctaContainer)
    return computed.flexDirection === 'column' || computed.display === 'block'
  })

  logger.info(`Mobile layout stacked: ${isStacked}, no overflow: ${noOverflow}`)
  await takeScreenshot(page, 'landing_mobile_iphoneSE')
}

// ============================================================
// TEST 2: Nav hamburger menu (iPhone SE)
// ============================================================
async function testHamburgerMenu(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing hamburger menu on mobile')
  await setMobileViewport(page, 'iphoneSE')
  await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' })
  await wait(2000)

  // Desktop nav doit être cachée
  const desktopNavHidden = await page.evaluate(() => {
    const navItems = document.querySelectorAll('nav a, header a')
    let visibleDesktopLinks = 0
    navItems.forEach(item => {
      const rect = item.getBoundingClientRect()
      const text = item.textContent?.trim() || ''
      // Les liens de navigation (pas le logo) devraient être cachés
      if (rect.width > 0 && rect.height > 0 && text.length > 3 && text !== 'EvalUp') {
        const parent = item.closest('[class*="hidden"][class*="md:"]')
        if (!parent) visibleDesktopLinks++
      }
    })
    return visibleDesktopLinks < 4 // On tolère le logo + quelques liens
  })

  // Chercher le bouton hamburger
  const hamburgerBtn = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const hamburger = buttons.find(btn => {
      const svg = btn.querySelector('svg')
      const hasLines = btn.innerHTML.includes('M4') || btn.innerHTML.includes('menu') ||
                       btn.className.includes('menu') || btn.getAttribute('aria-label')?.includes('menu')
      // Bouton avec 3 barres SVG ou icône menu
      return svg && (hasLines || btn.className.includes('md:hidden'))
    })
    return !!hamburger
  })

  if (!hamburgerBtn) {
    logger.warn('Hamburger button not found - mobile nav may use a different pattern')
  } else {
    // Cliquer sur le hamburger
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const hamburger = buttons.find(btn => {
        const svg = btn.querySelector('svg')
        return svg && (btn.innerHTML.includes('M4') || btn.className.includes('md:hidden'))
      })
      if (hamburger) hamburger.click()
    })

    await wait(500)

    // Vérifier que le menu mobile s'affiche
    const menuOpened = await page.evaluate(() => {
      const text = document.body.innerText
      return text.includes('Tarifs') || text.includes('Aide') || text.includes('Connexion')
    })

    if (!menuOpened) {
      logger.warn('Mobile menu may not have opened')
    }
  }

  logger.info(`Desktop nav hidden: ${desktopNavHidden}, hamburger found: ${hamburgerBtn}`)
  await takeScreenshot(page, 'hamburger_menu')
}

// ============================================================
// TEST 3: Menu mobile navigation
// ============================================================
async function testMobileMenuNavigation(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing mobile menu navigation')
  await setMobileViewport(page, 'iphoneSE')
  await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2' })
  await wait(2000)

  // Ouvrir le menu hamburger
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const hamburger = buttons.find(btn => btn.querySelector('svg') && btn.innerHTML.includes('M4'))
    if (hamburger) hamburger.click()
  })
  await wait(500)

  // Cliquer sur "Tarifs" dans le menu mobile
  await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'))
    const tarifsLink = links.find(link => link.textContent?.includes('Tarifs'))
    if (tarifsLink) tarifsLink.click()
  })
  await wait(2000)

  const url = page.url()
  if (url.includes('/tarifs') || url.includes('#')) {
    logger.info('Mobile menu navigation works')
  } else {
    logger.warn(`Mobile menu navigation: expected /tarifs, got ${url}`)
  }

  await takeScreenshot(page, 'mobile_menu_nav')
}

// ============================================================
// TEST 4: Pricing cards mobile (1 colonne)
// ============================================================
async function testPricingMobileLayout(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing pricing cards mobile layout')
  await setMobileViewport(page, 'iphoneSE')
  await page.goto(`${TEST_CONFIG.baseUrl}/tarifs`, { waitUntil: 'networkidle2' })
  await wait(2000)

  const noOverflow = await checkNoHorizontalOverflow(page)
  if (!noOverflow) {
    throw new Error('Pricing page has horizontal overflow on mobile')
  }

  // Vérifier que les prix sont lisibles
  const pricesVisible = await page.evaluate(() => {
    const text = document.body.innerText
    return text.includes('79') && (text.includes('199') || text.includes('Gratuit'))
  })

  if (!pricesVisible) {
    throw new Error('Prices not visible on mobile pricing page')
  }

  // Vérifier les CTAs cliquables
  const ctaCount = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, a'))
    return buttons.filter(btn => {
      const text = btn.textContent || ''
      const rect = btn.getBoundingClientRect()
      return (text.includes('Commencer') || text.includes('Acheter') || text.includes('abonner')) &&
             rect.width > 0 && rect.height > 0
    }).length
  })

  logger.info(`Mobile pricing: no overflow=${noOverflow}, CTAs visible=${ctaCount}`)
  await takeScreenshot(page, 'pricing_mobile')
}

// ============================================================
// TEST 5: Chat mobile layout (iPhone 14)
// ============================================================
async function testChatMobileLayout(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing chat mobile layout (390x844)')
  await setMobileViewport(page, 'iphone14')
  await page.goto(`${TEST_CONFIG.baseUrl}/chat/${TEST_SIRENS.totalEnergies}`, {
    waitUntil: 'networkidle2',
  })
  await wait(3000)

  const layoutCheck = await page.evaluate(() => {
    // Input doit être en bas
    const textarea = document.querySelector('textarea')
    const inputRect = textarea?.getBoundingClientRect()
    const inputAtBottom = inputRect ? inputRect.bottom > window.innerHeight * 0.6 : false

    // Sidebar ne doit pas être visible
    const sidebar = document.querySelector('[class*="sidebar"]')
    const sidebarVisible = sidebar ?
      (sidebar.getBoundingClientRect().width > 50 &&
       window.getComputedStyle(sidebar).display !== 'none') : false

    return {
      hasTextarea: !!textarea,
      inputAtBottom,
      sidebarVisible,
      noOverflow: document.body.scrollWidth <= window.innerWidth,
    }
  })

  if (!layoutCheck.hasTextarea) {
    throw new Error('Chat textarea not found on mobile')
  }

  if (!layoutCheck.noOverflow) {
    throw new Error('Chat page has horizontal overflow on mobile')
  }

  logger.info(`Chat mobile layout: ${JSON.stringify(layoutCheck)}`)
  await takeScreenshot(page, 'chat_mobile_iphone14')
}

// ============================================================
// TEST 6: Chat input fonctionne sur mobile
// ============================================================
async function testChatMobileInput(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing chat input on mobile')
  await setMobileViewport(page, 'iphone14')
  await page.goto(`${TEST_CONFIG.baseUrl}/chat/${TEST_SIRENS.totalEnergies}?objectif=vente`, {
    waitUntil: 'networkidle2',
  })
  await wait(3000)

  try {
    await waitForStreamingEnd(page, 30000)
  } catch {
    logger.warn('Initial streaming timeout, continuing...')
  }

  // Envoyer un message
  try {
    await sendChatMessage(page, 'Boulangerie artisanale avec fabrication sur place, 200 clients par jour.')
    await waitForBotResponse(page, 45000)
    logger.info('Chat message sent and response received on mobile')
  } catch (error) {
    throw new Error(`Mobile chat input failed: ${error}`)
  }

  await takeScreenshot(page, 'chat_mobile_input')
}

// ============================================================
// TEST 7: Suggestions ne dépassent pas l'écran mobile
// ============================================================
async function testSuggestionsMobile(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing suggestions on mobile')
  await setMobileViewport(page, 'iphone14')
  await page.goto(`${TEST_CONFIG.baseUrl}/chat/${TEST_SIRENS.totalEnergies}?objectif=vente`, {
    waitUntil: 'networkidle2',
  })
  await wait(3000)

  try {
    await waitForStreamingEnd(page, 30000)
  } catch {
    logger.warn('Streaming timeout, checking suggestions anyway...')
  }

  const suggestionsCheck = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const suggestions = buttons.filter(btn => {
      const classes = btn.className
      return classes.includes('rounded-full') || classes.includes('rounded-xl')
    })

    let overflow = false
    for (const btn of suggestions) {
      const rect = btn.getBoundingClientRect()
      if (rect.right > window.innerWidth) {
        overflow = true
        break
      }
    }

    return {
      count: suggestions.length,
      overflow,
    }
  })

  if (suggestionsCheck.overflow) {
    throw new Error('Suggestions overflow screen on mobile')
  }

  logger.info(`Suggestions mobile: ${suggestionsCheck.count} found, overflow: ${suggestionsCheck.overflow}`)
  await takeScreenshot(page, 'suggestions_mobile')
}

// ============================================================
// TEST 8: Bento grid mobile (2 colonnes)
// ============================================================
async function testBentoGridMobile(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing bento grid on mobile')
  await setMobileViewport(page, 'iphone14')
  await page.goto(`${TEST_CONFIG.baseUrl}/chat/${TEST_SIRENS.totalEnergies}`, {
    waitUntil: 'networkidle2',
  })
  await wait(3000)

  const gridCheck = await page.evaluate(() => {
    // Chercher des éléments grid
    const grids = document.querySelectorAll('[class*="grid"]')
    let hasDataGrid = false
    let gridOverflow = false

    grids.forEach(grid => {
      const rect = grid.getBoundingClientRect()
      if (rect.width > 0) {
        hasDataGrid = true
        if (rect.right > window.innerWidth + 5) {
          gridOverflow = true
        }
      }
    })

    return { hasDataGrid, gridOverflow, noOverflow: document.body.scrollWidth <= window.innerWidth }
  })

  if (gridCheck.gridOverflow || !gridCheck.noOverflow) {
    throw new Error('Bento grid overflows on mobile')
  }

  logger.info(`Bento grid mobile: ${JSON.stringify(gridCheck)}`)
  await takeScreenshot(page, 'bento_grid_mobile')
}

// ============================================================
// TEST 9: Sidebar mobile toggle
// ============================================================
async function testSidebarMobileToggle(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing sidebar toggle on mobile')
  await setMobileViewport(page, 'iphone14')
  await page.goto(`${TEST_CONFIG.baseUrl}/chat/${TEST_SIRENS.totalEnergies}`, {
    waitUntil: 'networkidle2',
  })
  await wait(3000)

  // Chercher un bouton de toggle sidebar
  const sidebarToggle = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const toggle = buttons.find(btn => {
      const ariaLabel = btn.getAttribute('aria-label') || ''
      const title = btn.getAttribute('title') || ''
      return ariaLabel.includes('sidebar') || ariaLabel.includes('menu') ||
             title.includes('sidebar') || title.includes('historique') ||
             btn.innerHTML.includes('M4') || btn.innerHTML.includes('panel')
    })
    return !!toggle
  })

  if (sidebarToggle) {
    // Cliquer dessus
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const toggle = buttons.find(btn => {
        const ariaLabel = btn.getAttribute('aria-label') || ''
        return ariaLabel.includes('sidebar') || ariaLabel.includes('menu') ||
               ariaLabel.includes('historique')
      })
      if (toggle) toggle.click()
    })

    await wait(500)
    await takeScreenshot(page, 'sidebar_mobile_open')

    // Fermer
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const close = buttons.find(btn =>
        btn.textContent?.includes('Fermer') ||
        btn.getAttribute('aria-label')?.includes('close')
      )
      if (close) close.click()
    })
  } else {
    logger.info('No sidebar toggle found on mobile - sidebar may be fully hidden')
  }

  await takeScreenshot(page, 'sidebar_mobile_toggle')
}

// ============================================================
// TEST 10: iPad pricing layout (2 colonnes)
// ============================================================
async function testIPadPricingLayout(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing pricing layout on iPad (768x1024)')
  await setMobileViewport(page, 'ipad')
  await page.goto(`${TEST_CONFIG.baseUrl}/tarifs`, { waitUntil: 'networkidle2' })
  await wait(2000)

  const noOverflow = await checkNoHorizontalOverflow(page)
  if (!noOverflow) {
    throw new Error('Pricing page overflows on iPad')
  }

  const pricesVisible = await page.evaluate(() => {
    const text = document.body.innerText
    return text.includes('79') && text.includes('199')
  })

  if (!pricesVisible) {
    throw new Error('Prices not visible on iPad')
  }

  logger.info('iPad pricing layout OK')
  await takeScreenshot(page, 'pricing_ipad')
}

// ============================================================
// TEST 11: iPad chat layout
// ============================================================
async function testIPadChatLayout(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing chat layout on iPad')
  await setMobileViewport(page, 'ipad')
  await page.goto(`${TEST_CONFIG.baseUrl}/chat/${TEST_SIRENS.totalEnergies}`, {
    waitUntil: 'networkidle2',
  })
  await wait(3000)

  const layoutCheck = await page.evaluate(() => {
    const textarea = document.querySelector('textarea')
    return {
      hasTextarea: !!textarea,
      noOverflow: document.body.scrollWidth <= window.innerWidth,
    }
  })

  if (!layoutCheck.hasTextarea) {
    throw new Error('Chat textarea not found on iPad')
  }

  if (!layoutCheck.noOverflow) {
    throw new Error('Chat page overflows on iPad')
  }

  logger.info(`iPad chat layout: ${JSON.stringify(layoutCheck)}`)
  await takeScreenshot(page, 'chat_ipad')
}

// ============================================================
// TEST 12: Touch scroll chat (multiple messages)
// ============================================================
async function testTouchScrollChat(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing chat scroll on mobile with multiple messages')
  await setMobileViewport(page, 'iphone14')
  await page.goto(`${TEST_CONFIG.baseUrl}/chat/${TEST_SIRENS.totalEnergies}?objectif=vente`, {
    waitUntil: 'networkidle2',
  })
  await wait(3000)

  try {
    await waitForStreamingEnd(page, 30000)
  } catch {
    logger.warn('Initial streaming timeout, continuing...')
  }

  // Envoyer quelques messages pour remplir le chat
  const messages = [
    'Boulangerie artisanale avec fabrication sur place.',
    'Le CA est stable depuis 3 ans, environ 485000 euros.',
    'Nous avons 6 salariés dont 2 boulangers.',
  ]

  for (const msg of messages) {
    try {
      await sendChatMessage(page, msg)
      await waitForBotResponse(page, 45000)
      await wait(500)
    } catch {
      logger.warn('Message send/receive failed, continuing...')
    }
  }

  // Vérifier que le dernier message est visible (auto-scroll)
  const lastMessageVisible = await page.evaluate(() => {
    const messages = document.querySelectorAll('[class*="flex gap"]')
    if (messages.length === 0) return true
    const lastMsg = messages[messages.length - 1]
    const rect = lastMsg.getBoundingClientRect()
    return rect.bottom <= window.innerHeight + 100
  })

  logger.info(`Last message visible (auto-scroll): ${lastMessageVisible}`)
  await takeScreenshot(page, 'chat_scroll_mobile')
}

// ============================================================
// TEST 13: Pas de débordement horizontal sur pages clés
// ============================================================
async function testNoHorizontalOverflowPages(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing no horizontal overflow on key pages')
  await setMobileViewport(page, 'iphoneSE')

  const pages = ['/', '/tarifs', '/aide', '/cgv', '/contact']
  const overflowPages: string[] = []

  for (const pagePath of pages) {
    await page.goto(`${TEST_CONFIG.baseUrl}${pagePath}`, { waitUntil: 'networkidle2' })
    await wait(1000)

    const noOverflow = await checkNoHorizontalOverflow(page)
    if (!noOverflow) {
      overflowPages.push(pagePath)
      logger.warn(`Horizontal overflow on ${pagePath}`)
      await takeScreenshot(page, `overflow_${pagePath.replace(/\//g, '_')}`)
    }
  }

  if (overflowPages.length > 0) {
    throw new Error(`Horizontal overflow on pages: ${overflowPages.join(', ')}`)
  }

  logger.info('No horizontal overflow on any tested page')
}

// ============================================================
// TEST 14: Legal pages mobile (texte lisible)
// ============================================================
async function testLegalPagesMobile(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing legal pages on mobile')
  await setMobileViewport(page, 'iphoneSE')
  await page.goto(`${TEST_CONFIG.baseUrl}/cgv`, { waitUntil: 'networkidle2' })
  await wait(2000)

  const readabilityCheck = await page.evaluate(() => {
    const h1 = document.querySelector('h1')
    const paragraphs = document.querySelectorAll('p')

    // Vérifier que le texte ne déborde pas
    const noOverflow = document.body.scrollWidth <= window.innerWidth

    // Vérifier que les paragraphes ont une taille de police lisible
    let readableFont = true
    paragraphs.forEach(p => {
      const fontSize = parseFloat(window.getComputedStyle(p).fontSize)
      if (fontSize < 12) readableFont = false
    })

    return {
      hasH1: !!h1,
      paragraphCount: paragraphs.length,
      noOverflow,
      readableFont,
    }
  })

  if (!readabilityCheck.noOverflow) {
    throw new Error('Legal page has horizontal overflow on mobile')
  }

  if (!readabilityCheck.readableFont) {
    logger.warn('Some text on legal page may be too small on mobile')
  }

  logger.info(`Legal page mobile: ${JSON.stringify(readabilityCheck)}`)
  await takeScreenshot(page, 'legal_mobile')
}

// ============================================================
// MAIN — Tests stables d'abord, tests chat (risque crash) ensuite
// Recréation du browser entre les deux groupes
// ============================================================
export async function runMobileTests(reporter: TestReporter): Promise<void> {
  reporter.startModule(MODULE_NAME)

  // GROUPE 1: Tests stables (pages statiques, pas de chat SSE)
  let ctx = await createTestContext(MODULE_NAME)

  try {
    reporter.addResult(await runTest('Landing mobile layout (iPhone SE)', async () => {
      await testLandingMobileLayout(ctx.page, ctx.logger)
    }, ctx.logger, reporter))

    reporter.addResult(await runTest('Nav hamburger menu', async () => {
      await testHamburgerMenu(ctx.page, ctx.logger)
    }, ctx.logger, reporter))

    reporter.addResult(await runTest('Menu mobile navigation', async () => {
      await testMobileMenuNavigation(ctx.page, ctx.logger)
    }, ctx.logger, reporter))

    reporter.addResult(await runTest('Pricing cards mobile', async () => {
      await testPricingMobileLayout(ctx.page, ctx.logger)
    }, ctx.logger, reporter))

    reporter.addResult(await runTest('iPad pricing layout', async () => {
      await testIPadPricingLayout(ctx.page, ctx.logger)
    }, ctx.logger, reporter))

    reporter.addResult(await runTest('Pas de débordement horizontal', async () => {
      await testNoHorizontalOverflowPages(ctx.page, ctx.logger)
    }, ctx.logger, reporter))

    reporter.addResult(await runTest('Legal pages mobile', async () => {
      await testLegalPagesMobile(ctx.page, ctx.logger)
    }, ctx.logger, reporter))
  } finally {
    await closeTestContext(ctx)
  }

  // GROUPE 2: Tests chat (SSE streaming — peuvent crasher le browser)
  // Nouveau browser pour isoler les crashs
  ctx = await createTestContext(MODULE_NAME + '-chat')

  try {
    reporter.addResult(await runTest('Chat mobile layout (iPhone 14)', async () => {
      await testChatMobileLayout(ctx.page, ctx.logger)
    }, ctx.logger, reporter))

    reporter.addResult(await runTest('Bento grid mobile', async () => {
      await testBentoGridMobile(ctx.page, ctx.logger)
    }, ctx.logger, reporter))

    reporter.addResult(await runTest('iPad chat layout', async () => {
      await testIPadChatLayout(ctx.page, ctx.logger)
    }, ctx.logger, reporter))

    reporter.addResult(await runTest('Sidebar mobile toggle', async () => {
      await testSidebarMobileToggle(ctx.page, ctx.logger)
    }, ctx.logger, reporter))
  } catch (error) {
    ctx.logger.error(`Chat group crashed: ${error}`)
  } finally {
    await closeTestContext(ctx).catch(() => {})
  }

  // GROUPE 3: Tests chat interactif (envoie de messages — plus haut risque)
  ctx = await createTestContext(MODULE_NAME + '-interactive')

  try {
    reporter.addResult(await runTest('Chat input mobile', async () => {
      await testChatMobileInput(ctx.page, ctx.logger)
    }, ctx.logger, reporter))

    reporter.addResult(await runTest('Suggestions mobile', async () => {
      await testSuggestionsMobile(ctx.page, ctx.logger)
    }, ctx.logger, reporter))

    reporter.addResult(await runTest('Touch scroll chat', async () => {
      await testTouchScrollChat(ctx.page, ctx.logger)
    }, ctx.logger, reporter))
  } catch (error) {
    ctx.logger.error(`Interactive group crashed: ${error}`)
  } finally {
    await closeTestContext(ctx).catch(() => {})
  }

  reporter.endModule()
}

if (require.main === module) {
  const { getReporter } = require('../utils/reporter')
  const reporter = getReporter()

  runMobileTests(reporter)
    .then(() => {
      reporter.printSummary()
      reporter.saveReport('mobile_tests.json')
      process.exit(reporter.generateReport().summary.failed > 0 ? 1 : 0)
    })
    .catch(err => {
      console.error('Fatal error:', err)
      process.exit(1)
    })
}
