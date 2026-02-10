// Utilitaires Puppeteer pour les tests
import puppeteer, { Browser, Page } from 'puppeteer'
import * as fs from 'fs'
import * as path from 'path'
import { TEST_CONFIG, MOBILE_VIEWPORTS } from '../config'
import { TestLogger, getLogger } from './logger'

export interface TestContext {
  browser: Browser
  page: Page
  logger: TestLogger
}

// Lancer le navigateur
export async function launchBrowser(): Promise<Browser> {
  return puppeteer.launch({
    headless: TEST_CONFIG.headless,
    slowMo: TEST_CONFIG.slowMo,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
    ],
  })
}

// Créer un contexte de test
export async function createTestContext(moduleName: string): Promise<TestContext> {
  const browser = await launchBrowser()
  const page = await browser.newPage()
  const logger = getLogger(moduleName)

  // Configurer la page
  await page.setViewport({ width: 1280, height: 800 })
  await page.setDefaultTimeout(TEST_CONFIG.timeout)

  // Intercepter les erreurs console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      logger.error(`Browser console: ${msg.text()}`)
    }
  })

  // Intercepter les erreurs de page
  page.on('pageerror', (error) => {
    logger.error(`Page error: ${error instanceof Error ? error.message : String(error)}`)
  })

  // Intercepter les requêtes échouées
  page.on('requestfailed', request => {
    logger.warn(`Request failed: ${request.url()} - ${request.failure()?.errorText}`)
  })

  return { browser, page, logger }
}

// Fermer le contexte
export async function closeTestContext(ctx: TestContext) {
  await ctx.browser.close()
}

// Prendre une capture d'écran
export async function takeScreenshot(page: Page, name: string): Promise<string> {
  const screenshotDir = TEST_CONFIG.paths.screenshots || './tests/screenshots'
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `${name}_${timestamp}.png`
  const filepath = path.join(screenshotDir, filename)

  await page.screenshot({ path: filepath, fullPage: true })
  return filepath
}

// Attendre et cliquer sur un élément
export async function waitAndClick(page: Page, selector: string, logger?: TestLogger) {
  logger?.debug(`Waiting for and clicking: ${selector}`)
  await page.waitForSelector(selector, { visible: true })
  await page.click(selector)
}

// Attendre et taper du texte
export async function waitAndType(page: Page, selector: string, text: string, logger?: TestLogger) {
  logger?.debug(`Typing in ${selector}: ${text.substring(0, 50)}...`)
  await page.waitForSelector(selector, { visible: true })
  await page.type(selector, text)
}

// Attendre un texte sur la page
export async function waitForText(page: Page, text: string, timeout = 10000): Promise<boolean> {
  try {
    await page.waitForFunction(
      (searchText) => document.body.innerText.includes(searchText),
      { timeout },
      text
    )
    return true
  } catch {
    return false
  }
}

// Attendre la fin du chargement
export async function waitForPageLoad(page: Page) {
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {})
}

// Helper pour attendre (remplace waitForTimeout déprécié)
export async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Attendre que le streaming soit terminé (pas de curseur clignotant)
export async function waitForStreamingEnd(page: Page, timeout = 60000) {
  // Attendre que le spinner ou le curseur de streaming disparaisse
  await page.waitForFunction(
    () => {
      const spinner = document.querySelector('.animate-spin')
      const cursor = document.querySelector('.animate-pulse')
      return !spinner && !cursor
    },
    { timeout }
  )
}

// Extraire le contenu du chat
export async function getChatMessages(page: Page): Promise<Array<{ role: string; content: string }>> {
  return page.evaluate(() => {
    const messages: Array<{ role: string; content: string }> = []
    // Sélectionner tous les messages du chat
    const messageElements = document.querySelectorAll('[class*="MessageBubble"], [class*="message"]')

    messageElements.forEach(el => {
      const isUser = el.classList.contains('justify-end') ||
                     el.querySelector('[class*="bg-[#c9a227]"]') !== null
      const content = el.textContent || ''
      messages.push({
        role: isUser ? 'user' : 'assistant',
        content: content.trim(),
      })
    })

    return messages
  })
}

// Cliquer sur une suggestion
export async function clickSuggestion(page: Page, suggestionText: string, logger?: TestLogger) {
  logger?.debug(`Clicking suggestion: ${suggestionText}`)

  await page.evaluate((text) => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const button = buttons.find(btn =>
      btn.textContent?.toLowerCase().includes(text.toLowerCase())
    )
    if (button) {
      (button as HTMLButtonElement).click()
    }
  }, suggestionText)
}

// Envoyer un message dans le chat
export async function sendChatMessage(page: Page, message: string, logger?: TestLogger) {
  logger?.info(`Sending message: ${message.substring(0, 100)}...`)

  // Trouver le textarea
  const textareaSelector = 'textarea'
  await page.waitForSelector(textareaSelector)

  // Effacer et taper le message
  await page.click(textareaSelector, { clickCount: 3 })
  await page.type(textareaSelector, message)

  // Cliquer sur le bouton d'envoi
  const sendButton = await page.$('button[type="submit"]')
  if (sendButton) {
    await sendButton.click()
  } else {
    // Ou appuyer sur Entrée
    await page.keyboard.press('Enter')
  }

  // Attendre que le message soit envoyé et la réponse arrive
  await wait(1000)
}

// Attendre la réponse du bot
export async function waitForBotResponse(page: Page, timeout = 60000): Promise<string> {
  // Attendre que le streaming commence puis se termine
  await wait(500) // Petit délai pour que le streaming commence

  // Attendre la fin du streaming
  await waitForStreamingEnd(page, timeout)

  // Récupérer le dernier message
  const lastMessage = await page.evaluate(() => {
    const messages = document.querySelectorAll('[class*="flex gap-3"]')
    const lastMsg = messages[messages.length - 1]
    return lastMsg?.textContent || ''
  })

  return lastMessage
}

// Configurer un viewport mobile
export async function setMobileViewport(
  page: Page,
  device: keyof typeof MOBILE_VIEWPORTS
) {
  const viewport = MOBILE_VIEWPORTS[device]
  await page.setViewport({
    width: viewport.width,
    height: viewport.height,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  })
}

// Vérifier qu'il n'y a pas de débordement horizontal
export async function checkNoHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    return document.body.scrollWidth <= window.innerWidth
  })
}

// Vérifier qu'un élément est visible dans le viewport
export async function isElementVisible(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return false
    const rect = el.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0
  }, selector)
}
