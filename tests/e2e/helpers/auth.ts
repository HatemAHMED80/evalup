// Helpers d'authentification pour les tests E2E
import { Page } from 'puppeteer'
import { TEST_CONFIG } from '../../config'
import { wait } from '../../utils/browser'
import { TestLogger } from '../../utils/logger'

/**
 * Se connecter avec les identifiants de test.
 * Après cette fonction, le cookie Supabase est défini.
 */
export async function login(page: Page, logger?: TestLogger): Promise<boolean> {
  logger?.info('Logging in with test credentials...')

  await page.goto(`${TEST_CONFIG.baseUrl}/connexion`, { waitUntil: 'networkidle2' })
  await wait(2000)

  const emailInput = await page.$('input[type="email"]')
  const passwordInput = await page.$('input[type="password"]')

  if (!emailInput || !passwordInput) {
    logger?.error('Login form inputs not found')
    return false
  }

  // Clear and type credentials
  await emailInput.click({ clickCount: 3 })
  await emailInput.type(TEST_CONFIG.testUser.email)
  await passwordInput.click({ clickCount: 3 })
  await passwordInput.type(TEST_CONFIG.testUser.password)

  // Submit
  const submitted = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent?.toLowerCase().includes('connecter')
    )
    if (btn) {
      ;(btn as HTMLButtonElement).click()
      return true
    }
    return false
  })

  if (!submitted) {
    await page.keyboard.press('Enter')
  }

  // Wait for redirect (login success → dashboard or previous page)
  await wait(4000)

  const url = page.url()
  const isLoggedIn = !url.includes('/connexion') && !url.includes('/inscription')

  if (isLoggedIn) {
    logger?.info(`Login successful — redirected to ${url}`)
  } else {
    // Check for error message
    const hasError = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase()
      return text.includes('incorrect') || text.includes('erreur') || text.includes('invalid')
    })
    if (hasError) {
      logger?.error('Login failed — incorrect credentials')
    } else {
      logger?.warn('Login state unclear — still on connexion page')
    }
  }

  return isLoggedIn
}

/**
 * Vérifier si l'utilisateur est connecté.
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    // Check for auth indicators: absence of login links, presence of account menu
    const text = document.body.innerText.toLowerCase()
    const hasLogout = text.includes('déconnexion') || text.includes('mon compte')
    const hasLoginPrompt = text.includes('se connecter') || text.includes('connexion')
    return hasLogout || !hasLoginPrompt
  })
}

/**
 * Se déconnecter.
 */
export async function logout(page: Page, logger?: TestLogger): Promise<void> {
  logger?.info('Logging out...')
  await page.goto(`${TEST_CONFIG.baseUrl}/compte`, { waitUntil: 'networkidle2' })
  await wait(2000)

  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent?.toLowerCase().includes('déconnexion') || b.textContent?.toLowerCase().includes('deconnexion')
    )
    if (btn) (btn as HTMLButtonElement).click()
  })

  await wait(3000)
  logger?.info('Logout completed')
}
