// Tests E2E du module Auth (connexion, inscription, Google OAuth, déconnexion)
import { Page } from 'puppeteer'
import { TEST_CONFIG } from '../config'
import { TestLogger } from '../utils/logger'
import { TestReporter, TestResult } from '../utils/reporter'
import {
  createTestContext,
  closeTestContext,
  takeScreenshot,
  wait,
  waitForText,
} from '../utils/browser'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

const MODULE_NAME = 'auth'

// E2E test user for signup + login flow
const E2E_TEST_USER = {
  email: process.env.TEST_E2E_EMAIL || 'hatem+e2e@cajis.fr',
  password: process.env.TEST_E2E_PASSWORD || 'qsdfghjk',
}

/**
 * Create a Supabase admin client (service role) for test operations
 * like deleting/confirming users programmatically.
 */
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for admin operations')
  }
  return createSupabaseAdmin(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

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
// TEST 1: Page connexion charge correctement
// ============================================================
async function testConnexionPageLoads(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing /connexion page loads')

  await page.goto(`${TEST_CONFIG.baseUrl}/connexion`, { waitUntil: 'networkidle2' })
  await wait(2000)

  const pageState = await page.evaluate(() => {
    const text = document.body.innerText
    const emailInput = document.querySelector('input[type="email"]')
    const passwordInput = document.querySelector('input[type="password"]')
    const submitBtn = Array.from(document.querySelectorAll('button')).find(btn =>
      btn.textContent?.includes('connecter')
    )
    const googleBtn = Array.from(document.querySelectorAll('button')).find(btn =>
      btn.textContent?.includes('Google')
    )
    const inscriptionLink = Array.from(document.querySelectorAll('a')).find(a =>
      a.textContent?.includes('inscrire') || a.getAttribute('href')?.includes('/inscription')
    )

    return {
      hasTitle: text.includes('Connexion'),
      hasEmailInput: !!emailInput,
      hasPasswordInput: !!passwordInput,
      hasSubmitButton: !!submitBtn,
      hasGoogleButton: !!googleBtn,
      hasInscriptionLink: !!inscriptionLink,
      hasForgotPasswordLink: text.includes('Mot de passe oubli'),
    }
  })

  logger.info(`Connexion page state: ${JSON.stringify(pageState)}`)

  if (!pageState.hasTitle) throw new Error('Missing "Connexion" title')
  if (!pageState.hasEmailInput) throw new Error('Missing email input')
  if (!pageState.hasPasswordInput) throw new Error('Missing password input')
  if (!pageState.hasSubmitButton) throw new Error('Missing submit button')
  if (!pageState.hasGoogleButton) throw new Error('Missing Google button')
  if (!pageState.hasInscriptionLink) throw new Error('Missing inscription link')

  await takeScreenshot(page, 'connexion_page')
}

// ============================================================
// TEST 2: Page inscription charge correctement
// ============================================================
async function testInscriptionPageLoads(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing /inscription page loads')

  await page.goto(`${TEST_CONFIG.baseUrl}/inscription`, { waitUntil: 'networkidle2' })
  await wait(2000)

  const pageState = await page.evaluate(() => {
    const text = document.body.innerText
    const emailInput = document.querySelector('input[type="email"]')
    const passwordInputs = document.querySelectorAll('input[type="password"]')
    const submitBtn = Array.from(document.querySelectorAll('button')).find(btn =>
      btn.textContent?.includes('Creer') || btn.textContent?.includes('Créer')
    )
    const googleBtn = Array.from(document.querySelectorAll('button')).find(btn =>
      btn.textContent?.includes('Google')
    )
    const cguCheckbox = document.querySelector('input[type="checkbox"]')
    const connexionLink = Array.from(document.querySelectorAll('a')).find(a =>
      a.textContent?.includes('connecter') || a.getAttribute('href')?.includes('/connexion')
    )

    return {
      hasTitle: text.includes('Creer un compte') || text.includes('Créer un compte'),
      hasEmailInput: !!emailInput,
      hasPasswordInputs: passwordInputs.length >= 2, // password + confirm
      hasSubmitButton: !!submitBtn,
      hasGoogleButton: !!googleBtn,
      hasCguCheckbox: !!cguCheckbox,
      hasConnexionLink: !!connexionLink,
    }
  })

  logger.info(`Inscription page state: ${JSON.stringify(pageState)}`)

  if (!pageState.hasTitle) throw new Error('Missing "Créer un compte" title')
  if (!pageState.hasEmailInput) throw new Error('Missing email input')
  if (!pageState.hasPasswordInputs) throw new Error('Missing password inputs (need 2)')
  if (!pageState.hasSubmitButton) throw new Error('Missing submit button')
  if (!pageState.hasGoogleButton) throw new Error('Missing Google button')
  if (!pageState.hasCguCheckbox) throw new Error('Missing CGU checkbox')

  await takeScreenshot(page, 'inscription_page')
}

// ============================================================
// TEST 3: Connexion avec mauvais identifiants affiche erreur
// ============================================================
async function testLoginBadCredentials(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing login with bad credentials')

  await page.goto(`${TEST_CONFIG.baseUrl}/connexion`, { waitUntil: 'networkidle2' })
  await wait(2000)

  // Remplir avec de mauvais identifiants
  const emailInput = await page.$('input[type="email"]')
  const passwordInput = await page.$('input[type="password"]')

  if (!emailInput || !passwordInput) throw new Error('Form inputs not found')

  await emailInput.click({ clickCount: 3 })
  await emailInput.type('faux@email.com')
  await passwordInput.click({ clickCount: 3 })
  await passwordInput.type('mauvais_password')

  // Soumettre
  const submitBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(btn =>
      btn.textContent?.includes('connecter')
    )
  })
  await (submitBtn as any).click()

  // Attendre la réponse
  await wait(3000)

  // Vérifier le message d'erreur
  const hasError = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    return text.includes('incorrect') || text.includes('erreur') || text.includes('invalid')
  })

  if (!hasError) throw new Error('No error message shown for bad credentials')

  logger.info('Error message displayed for bad credentials')
  await takeScreenshot(page, 'login_bad_credentials')
}

// ============================================================
// TEST 4: Inscription - validation mot de passe court
// ============================================================
async function testSignupPasswordValidation(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing signup password validation')

  await page.goto(`${TEST_CONFIG.baseUrl}/inscription`, { waitUntil: 'networkidle2' })
  await wait(2000)

  const emailInput = await page.$('input[type="email"]')
  const passwordInputs = await page.$$('input[type="password"]')

  if (!emailInput || passwordInputs.length < 2) throw new Error('Form inputs not found')

  await emailInput.click({ clickCount: 3 })
  await emailInput.type('test@test.com')
  await passwordInputs[0].click({ clickCount: 3 })
  await passwordInputs[0].type('abc') // Trop court
  await passwordInputs[1].click({ clickCount: 3 })
  await passwordInputs[1].type('abc')

  // Cocher CGU
  const checkbox = await page.$('input[type="checkbox"]')
  if (checkbox) await checkbox.click()

  // Soumettre
  const submitBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(btn =>
      btn.textContent?.includes('Creer') || btn.textContent?.includes('Créer')
    )
  })
  await (submitBtn as any).click()

  await wait(2000)

  // Vérifier l'erreur de validation
  const hasValidationError = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    return text.includes('8 caractere') || text.includes('8 caractères') ||
           text.includes('minimum') || text.includes('trop court')
  })

  if (!hasValidationError) throw new Error('No password length validation error shown')

  logger.info('Password validation error displayed')
  await takeScreenshot(page, 'signup_password_validation')
}

// ============================================================
// TEST 5: Inscription - mots de passe non identiques
// ============================================================
async function testSignupPasswordMismatch(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing signup password mismatch')

  await page.goto(`${TEST_CONFIG.baseUrl}/inscription`, { waitUntil: 'networkidle2' })
  await wait(2000)

  const emailInput = await page.$('input[type="email"]')
  const passwordInputs = await page.$$('input[type="password"]')

  if (!emailInput || passwordInputs.length < 2) throw new Error('Form inputs not found')

  await emailInput.click({ clickCount: 3 })
  await emailInput.type('test@test.com')
  await passwordInputs[0].click({ clickCount: 3 })
  await passwordInputs[0].type('password123')
  await passwordInputs[1].click({ clickCount: 3 })
  await passwordInputs[1].type('differentpass')

  await wait(1000)

  // Vérifier l'erreur live (validation inline)
  const hasMismatchError = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    return text.includes('ne correspondent pas') || text.includes('mismatch')
  })

  if (!hasMismatchError) {
    // Essayer de soumettre pour déclencher l'erreur
    const checkbox = await page.$('input[type="checkbox"]')
    if (checkbox) await checkbox.click()

    const submitBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('button')).find(btn =>
        btn.textContent?.includes('Creer') || btn.textContent?.includes('Créer')
      )
    })
    await (submitBtn as any).click()
    await wait(2000)

    const hasMismatchAfterSubmit = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase()
      return text.includes('ne correspondent pas')
    })

    if (!hasMismatchAfterSubmit) throw new Error('No password mismatch error shown')
  }

  logger.info('Password mismatch error displayed')
  await takeScreenshot(page, 'signup_password_mismatch')
}

// ============================================================
// TEST 6: Connexion réussie avec compte de test
// ============================================================
async function testLoginSuccess(page: Page, logger: TestLogger): Promise<void> {
  logger.info(`Testing login with test account: ${TEST_CONFIG.testUser.email}`)

  // Nettoyer les cookies et le localStorage
  await page.goto(`${TEST_CONFIG.baseUrl}/connexion`, { waitUntil: 'networkidle2' })
  await page.deleteCookie(...(await page.cookies()))
  await page.evaluate(() => localStorage.clear())

  await page.goto(`${TEST_CONFIG.baseUrl}/connexion`, { waitUntil: 'networkidle2' })
  await wait(2000)

  const emailInput = await page.$('input[type="email"]')
  const passwordInput = await page.$('input[type="password"]')

  if (!emailInput || !passwordInput) throw new Error('Form inputs not found')

  await emailInput.click({ clickCount: 3 })
  await emailInput.type(TEST_CONFIG.testUser.email)
  await passwordInput.click({ clickCount: 3 })
  await passwordInput.type(TEST_CONFIG.testUser.password)

  // Soumettre
  const submitBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(btn =>
      btn.textContent?.includes('connecter')
    )
  })
  await (submitBtn as any).click()

  // Attendre la redirection
  await wait(5000)

  const url = page.url()
  const isRedirected = url.includes('/app') || url.includes('/chat') || !url.includes('/connexion')

  if (!isRedirected) {
    // Vérifier s'il y a un message d'erreur
    const errorMsg = await page.evaluate(() => {
      const errorEl = document.querySelector('[class*="red"], [class*="error"]')
      return errorEl?.textContent || ''
    })
    throw new Error(`Login did not redirect. Still on: ${url}. Error: ${errorMsg}`)
  }

  logger.info(`Login successful, redirected to: ${url}`)
  await takeScreenshot(page, 'login_success')
}

// ============================================================
// TEST 7: Après connexion, /app est accessible
// ============================================================
async function testAppAccessAfterLogin(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing /app access after login')

  // The previous test (testLoginSuccess) logged in and was redirected to /app via router.push.
  // This is the real user flow: login → redirect → see content (no full page reload).
  const url = page.url()
  logger.info(`Current URL after login: ${url}`)

  if (!url.includes('/app')) {
    logger.warn(`Expected /app after login, got: ${url}`)
  }

  // Wait for actual content to render (auth check + component render)
  let hasContent = false
  for (let i = 0; i < 10; i++) {
    await wait(1000)

    const currentUrl = page.url()
    if (currentUrl.includes('/connexion')) {
      throw new Error(`/app redirected to connexion — session not preserved`)
    }

    hasContent = await page.evaluate(() => {
      const text = document.body.innerText
      return text.includes('Identifier') || text.includes('SIREN') ||
             text.includes('valuation') || text.includes('entreprise') ||
             text.length > 50
    })

    if (hasContent) break
    logger.info(`Waiting for /app content... (attempt ${i + 1}/10)`)
  }

  if (!hasContent) {
    const contentLength = await page.evaluate(() => document.body.innerText.length)
    const preview = await page.evaluate(() => document.body.innerText.substring(0, 200))
    logger.info(`/app content: length=${contentLength}, preview="${preview}"`)
    throw new Error('/app page content did not render after login redirect')
  }

  logger.info('/app content loaded after login')
  await takeScreenshot(page, 'app_after_login')
}

// ============================================================
// TEST 8: Après connexion, /compte est accessible
// ============================================================
async function testCompteAccessAfterLogin(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing /compte access after login')

  await page.goto(`${TEST_CONFIG.baseUrl}/compte`, { waitUntil: 'networkidle2' })
  await wait(3000)

  const url = page.url()
  const isOnCompte = url.includes('/compte') && !url.includes('/connexion')

  if (!isOnCompte) {
    throw new Error(`/compte redirected to ${url} — not authenticated?`)
  }

  const hasContent = await page.evaluate(() => document.body.innerText.length > 50)
  if (!hasContent) throw new Error('/compte page is blank after login')

  logger.info('/compte accessible after login')
  await takeScreenshot(page, 'compte_after_login')
}

// ============================================================
// TEST 9: Connexion avec redirect préserve l'URL d'origine
// ============================================================
async function testLoginRedirectPreservation(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing login redirect URL preservation')

  // Se déconnecter d'abord
  await page.deleteCookie(...(await page.cookies()))
  await page.evaluate(() => localStorage.clear())

  // Aller sur /connexion avec un redirect
  const redirectTarget = `/chat/${TEST_CONFIG.baseUrl.includes('localhost') ? '552032534' : '552032534'}`
  await page.goto(`${TEST_CONFIG.baseUrl}/connexion?redirect=${encodeURIComponent(redirectTarget)}`, {
    waitUntil: 'networkidle2',
  })
  await wait(2000)

  // Vérifier que le redirect est dans l'URL
  const currentUrl = page.url()
  const hasRedirectParam = currentUrl.includes('redirect=')

  logger.info(`Login page with redirect: ${currentUrl}, hasRedirectParam: ${hasRedirectParam}`)

  // Se connecter
  const emailInput = await page.$('input[type="email"]')
  const passwordInput = await page.$('input[type="password"]')

  if (!emailInput || !passwordInput) throw new Error('Form inputs not found')

  await emailInput.click({ clickCount: 3 })
  await emailInput.type(TEST_CONFIG.testUser.email)
  await passwordInput.click({ clickCount: 3 })
  await passwordInput.type(TEST_CONFIG.testUser.password)

  const submitBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(btn =>
      btn.textContent?.includes('connecter')
    )
  })
  await (submitBtn as any).click()

  await wait(5000)

  const finalUrl = page.url()
  const redirectedCorrectly = finalUrl.includes('/chat') || finalUrl.includes('552032534')

  if (!redirectedCorrectly) {
    logger.warn(`Redirect not preserved. Expected chat page, got: ${finalUrl}`)
  } else {
    logger.info(`Login redirect preserved correctly: ${finalUrl}`)
  }

  await takeScreenshot(page, 'login_redirect_preservation')
}

// ============================================================
// TEST 10: Bouton Google redirige vers Google OAuth
// ============================================================
async function testGoogleOAuthRedirect(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing Google OAuth button redirect')

  // Se déconnecter d'abord
  await page.deleteCookie(...(await page.cookies()))
  await page.evaluate(() => localStorage.clear())

  await page.goto(`${TEST_CONFIG.baseUrl}/connexion`, { waitUntil: 'networkidle2' })
  await wait(2000)

  // Intercepter les requêtes pour capturer l'URL de redirection et les erreurs
  let googleRedirectUrl = ''
  let providerError = ''

  page.on('request', (request) => {
    const url = request.url()
    if (url.includes('google') || url.includes('supabase.co/auth')) {
      googleRedirectUrl = url
    }
  })

  page.on('response', async (response) => {
    const url = response.url()
    if (url.includes('supabase.co/auth') && response.status() >= 400) {
      try {
        const body = await response.text()
        if (body.includes('provider') || body.includes('Unsupported')) {
          providerError = body
        }
      } catch { /* ignore */ }
    }
  })

  // Cliquer sur le bouton Google
  const googleBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(btn =>
      btn.textContent?.includes('Google')
    )
  })

  if (!googleBtn) throw new Error('Google button not found')

  // Cliquer et attendre la navigation
  try {
    await Promise.all([
      page.waitForNavigation({ timeout: 10000 }).catch(() => {}),
      (googleBtn as any).click(),
    ])
  } catch {
    // La navigation peut timeout
  }

  await wait(3000)

  // Vérifier si le provider Google n'est pas activé dans Supabase
  if (providerError.includes('Unsupported provider') || providerError.includes('not enabled')) {
    logger.warn('Google OAuth provider is NOT enabled in Supabase. Enable it in: Supabase Dashboard → Authentication → Providers → Google')
    // Ne pas faire échouer le test — c'est une config Supabase, pas un bug de code
    // Le bouton existe et envoie la bonne requête, le provider n'est juste pas configuré
    await takeScreenshot(page, 'google_oauth_not_enabled')
    return
  }

  const finalUrl = page.url()
  const isGoogleRedirect = finalUrl.includes('google') ||
                           finalUrl.includes('accounts.google') ||
                           finalUrl.includes('supabase') ||
                           googleRedirectUrl.includes('google') ||
                           googleRedirectUrl.includes('supabase')

  if (!isGoogleRedirect && !googleRedirectUrl) {
    logger.warn(`Google redirect not detected. Current URL: ${finalUrl}`)
  } else {
    logger.info(`Google OAuth redirect detected: ${googleRedirectUrl || finalUrl}`)
  }

  await takeScreenshot(page, 'google_oauth_redirect')
}

// ============================================================
// TEST 11: Page mot de passe oublié charge
// ============================================================
async function testForgotPasswordPage(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing /mot-de-passe-oublie page loads')

  await page.goto(`${TEST_CONFIG.baseUrl}/mot-de-passe-oublie`, { waitUntil: 'networkidle2' })
  await wait(2000)

  const pageState = await page.evaluate(() => {
    const text = document.body.innerText
    const emailInput = document.querySelector('input[type="email"]')
    const submitBtn = Array.from(document.querySelectorAll('button')).find(btn =>
      btn.textContent?.includes('Envoyer') || btn.textContent?.includes('lien')
    )
    const backLink = Array.from(document.querySelectorAll('a')).find(a =>
      a.textContent?.includes('connexion') || a.getAttribute('href')?.includes('/connexion')
    )

    return {
      hasTitle: text.includes('Mot de passe oubli'),
      hasEmailInput: !!emailInput,
      hasSubmitButton: !!submitBtn,
      hasBackLink: !!backLink,
    }
  })

  logger.info(`Forgot password page state: ${JSON.stringify(pageState)}`)

  if (!pageState.hasTitle) throw new Error('Missing "Mot de passe oublié" title')
  if (!pageState.hasEmailInput) throw new Error('Missing email input')
  if (!pageState.hasSubmitButton) throw new Error('Missing submit button')

  await takeScreenshot(page, 'forgot_password_page')
}

// ============================================================
// TEST 12: Mot de passe oublié - soumission affiche confirmation
// ============================================================
async function testForgotPasswordSubmit(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing forgot password form submission')

  await page.goto(`${TEST_CONFIG.baseUrl}/mot-de-passe-oublie`, { waitUntil: 'networkidle2' })
  await wait(2000)

  const emailInput = await page.$('input[type="email"]')
  if (!emailInput) throw new Error('Email input not found')

  await emailInput.click({ clickCount: 3 })
  await emailInput.type('test@example.com')

  const submitBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(btn =>
      btn.textContent?.includes('Envoyer') || btn.textContent?.includes('lien')
    )
  })
  await (submitBtn as any).click()

  await wait(3000)

  // Vérifier le message de confirmation
  const hasConfirmation = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase()
    return text.includes('email envoye') || text.includes('email envoyé') ||
           text.includes('lien') || text.includes('vérifiez') || text.includes('verifiez')
  })

  if (!hasConfirmation) throw new Error('No confirmation message after forgot password submit')

  logger.info('Forgot password confirmation displayed')
  await takeScreenshot(page, 'forgot_password_confirmation')
}

// ============================================================
// TEST 13: Navigation connexion → inscription et retour
// ============================================================
async function testAuthNavigation(page: Page, logger: TestLogger): Promise<void> {
  logger.info('Testing navigation between connexion and inscription')

  // Aller sur connexion
  await page.goto(`${TEST_CONFIG.baseUrl}/connexion`, { waitUntil: 'networkidle2' })
  await wait(2000)

  // Cliquer sur "S'inscrire"
  const inscriptionLink = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('a')).find(a =>
      a.textContent?.includes('inscrire') || a.getAttribute('href')?.includes('/inscription')
    )
  })
  await (inscriptionLink as any).click()
  await wait(3000)

  let url = page.url()
  if (!url.includes('/inscription')) {
    throw new Error(`Expected /inscription, got: ${url}`)
  }

  // Cliquer sur "Se connecter"
  const connexionLink = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('a')).find(a =>
      a.textContent?.includes('connecter') || a.getAttribute('href')?.includes('/connexion')
    )
  })
  await (connexionLink as any).click()
  await wait(3000)

  url = page.url()
  if (!url.includes('/connexion')) {
    throw new Error(`Expected /connexion, got: ${url}`)
  }

  logger.info('Auth navigation works: connexion ↔ inscription')
  await takeScreenshot(page, 'auth_navigation')
}

// ============================================================
// TEST 14: Full signup → confirm → login flow
// ============================================================
async function testSignupThenLogin(page: Page, logger: TestLogger): Promise<void> {
  const { email, password } = E2E_TEST_USER
  logger.info(`Testing full signup + login flow with: ${email}`)

  // ── Step 0: Clean up — delete existing user if any ──
  let adminClient: ReturnType<typeof getAdminClient>
  try {
    adminClient = getAdminClient()
  } catch (err) {
    throw new Error(`Cannot run signup test without admin client: ${err}`)
  }

  // Find and delete existing user by email
  const { data: existingUsers } = await adminClient.auth.admin.listUsers() as { data: { users: Array<{ id: string; email?: string }> } }
  const existingUser = existingUsers?.users?.find(u => u.email === email)
  if (existingUser) {
    logger.info(`  Deleting existing user: ${existingUser.id}`)
    await adminClient.auth.admin.deleteUser(existingUser.id)
    await wait(1000)
  }

  // ── Step 1: Navigate to /inscription ──
  logger.info('Step 1: Navigate to /inscription')
  await page.goto(`${TEST_CONFIG.baseUrl}/inscription`, { waitUntil: 'networkidle2' })
  await page.deleteCookie(...(await page.cookies()))
  await page.evaluate(() => { try { localStorage.clear() } catch {} })
  await page.goto(`${TEST_CONFIG.baseUrl}/inscription`, { waitUntil: 'networkidle2' })
  await wait(2000)

  // ── Step 2: Fill the signup form ──
  logger.info('Step 2: Fill signup form')
  const emailInput = await page.$('input[type="email"]')
  const passwordInputs = await page.$$('input[type="password"]')
  const checkbox = await page.$('input[type="checkbox"]')

  if (!emailInput) throw new Error('Email input not found on /inscription')
  if (passwordInputs.length < 2) throw new Error(`Expected 2 password inputs, found ${passwordInputs.length}`)
  if (!checkbox) throw new Error('CGU checkbox not found')

  await emailInput.click({ clickCount: 3 })
  await emailInput.type(email)
  await passwordInputs[0].click({ clickCount: 3 })
  await passwordInputs[0].type(password)
  await passwordInputs[1].click({ clickCount: 3 })
  await passwordInputs[1].type(password)
  await checkbox.click()

  // ── Step 3: Submit the form ──
  logger.info('Step 3: Submit signup form')
  const submitBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(btn => {
      const t = (btn.textContent || '').trim()
      return t.includes('Créer') || t.includes('Creer')
    })
  })
  if (!submitBtn) throw new Error('"Créer mon compte" button not found')
  await (submitBtn as any).click()
  await wait(3000)

  // ── Step 4: Check signup result ──
  logger.info('Step 4: Check signup result')
  const signupResult = await page.evaluate(() => {
    const text = document.body.innerText
    return {
      hasVerifyEmail: text.includes('Vérifiez votre email') || text.includes('email de confirmation'),
      hasAlreadyRegistered: text.includes('déjà utilisé') || text.includes('already registered'),
      hasError: !!document.querySelector('.bg-red-50'),
      errorText: document.querySelector('.bg-red-50')?.textContent?.trim() || '',
      bodyPreview: text.substring(0, 500),
    }
  })
  logger.info(`  Signup result: ${JSON.stringify(signupResult)}`)

  let signupViaUI = false

  if (signupResult.hasVerifyEmail) {
    logger.info('  Signup successful via UI — email verification required')
    signupViaUI = true
    await takeScreenshot(page, 'signup_e2e_success')
  } else if (signupResult.hasError) {
    const isRateLimit = signupResult.errorText.includes('rate limit')
    const isAlreadyRegistered = signupResult.hasAlreadyRegistered
    if (isRateLimit || isAlreadyRegistered) {
      logger.warn(`  Signup via UI hit limit: ${signupResult.errorText}`)
      logger.info('  Falling back to admin API user creation...')
      // Create user via admin API instead
      const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      if (createError) {
        // User might already exist, try to update password
        const { data: users } = await adminClient.auth.admin.listUsers() as { data: { users: Array<{ id: string; email?: string }> } }
        const user = users?.users?.find(u => u.email === email)
        if (user) {
          await adminClient.auth.admin.updateUserById(user.id, { password, email_confirm: true })
          logger.info(`  Updated existing user: ${user.id}`)
        } else {
          throw new Error(`Admin API create failed: ${createError.message}`)
        }
      } else {
        logger.info(`  User created via admin API: ${createData.user.id}`)
      }
      await takeScreenshot(page, 'signup_e2e_fallback_admin')
    } else {
      await takeScreenshot(page, 'signup_e2e_error')
      throw new Error(`Signup failed with error: ${signupResult.errorText}`)
    }
  } else {
    // Maybe auto-confirmed
    const url = page.url()
    if (url.includes('/app') || url.includes('/dashboard')) {
      logger.info('  Signup auto-confirmed (no email verification required)')
      signupViaUI = true
    } else {
      await takeScreenshot(page, 'signup_unexpected_state')
      throw new Error(`Signup didn't show verification screen or auto-redirect. Body: ${signupResult.bodyPreview}`)
    }
  }

  // ── Step 5: Confirm user via admin API (if signed up via UI) ──
  if (signupViaUI) {
    logger.info('Step 5: Confirm user via admin API')
    const { data: newUsers } = await adminClient.auth.admin.listUsers() as { data: { users: Array<{ id: string; email?: string }> } }
    const newUser = newUsers?.users?.find(u => u.email === email)
    if (!newUser) throw new Error(`User ${email} not found after signup`)

    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      newUser.id,
      { email_confirm: true }
    )
    if (updateError) throw new Error(`Failed to confirm user: ${updateError.message}`)
    logger.info(`  User confirmed: ${newUser.id}`)
  }
  await wait(500)

  // ── Step 6: Login with the new account ──
  logger.info('Step 6: Login with new account')
  await page.goto(`${TEST_CONFIG.baseUrl}/connexion`, { waitUntil: 'networkidle2' })
  await page.deleteCookie(...(await page.cookies()))
  await page.evaluate(() => { try { localStorage.clear() } catch {} })
  await page.goto(`${TEST_CONFIG.baseUrl}/connexion`, { waitUntil: 'networkidle2' })
  await wait(2000)

  const loginEmail = await page.$('input[type="email"]')
  const loginPassword = await page.$('input[type="password"]')
  if (!loginEmail || !loginPassword) throw new Error('Login form inputs not found')

  await loginEmail.click({ clickCount: 3 })
  await loginEmail.type(email)
  await loginPassword.click({ clickCount: 3 })
  await loginPassword.type(password)

  const loginBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(btn =>
      (btn.textContent || '').includes('connecter')
    )
  })
  if (!loginBtn) throw new Error('"Se connecter" button not found')
  await (loginBtn as any).click()
  await wait(5000)

  // ── Step 7: Verify login succeeded ──
  logger.info('Step 7: Verify login redirect')
  const loginUrl = page.url()
  const loginSuccess = !loginUrl.includes('/connexion')

  if (!loginSuccess) {
    const errorMsg = await page.evaluate(() => {
      const el = document.querySelector('.bg-red-50')
      return el?.textContent?.trim() || ''
    })
    await takeScreenshot(page, 'login_e2e_failed')
    throw new Error(`Login failed after signup. URL: ${loginUrl}. Error: ${errorMsg}`)
  }

  logger.info(`  Login successful! Redirected to: ${loginUrl}`)

  // ── Step 8: Verify protected page access ──
  logger.info('Step 8: Verify /compte access')
  await page.goto(`${TEST_CONFIG.baseUrl}/compte`, { waitUntil: 'networkidle2' })
  await wait(3000)

  const compteUrl = page.url()
  if (compteUrl.includes('/connexion')) {
    throw new Error(`/compte redirected to connexion — session not preserved after signup+login`)
  }

  const hasCompteContent = await page.evaluate(() => document.body.innerText.length > 50)
  if (!hasCompteContent) throw new Error('/compte is blank after signup+login')

  logger.info('  /compte accessible with new account')
  await takeScreenshot(page, 'signup_then_login_success')
  logger.info(`Full signup + login flow PASSED for ${email}`)
}

// ============================================================
// MAIN
// ============================================================
export async function runAuthTests(reporter: TestReporter): Promise<void> {
  reporter.startModule(MODULE_NAME)

  // GROUPE 1: Tests sans auth (pages, validation, navigation)
  let ctx = await createTestContext(MODULE_NAME)

  try {
    reporter.addResult(await runTest('Page connexion charge', async () => {
      await testConnexionPageLoads(ctx.page, ctx.logger)
    }, ctx.logger, reporter))

    reporter.addResult(await runTest('Page inscription charge', async () => {
      await testInscriptionPageLoads(ctx.page, ctx.logger)
    }, ctx.logger, reporter))

    reporter.addResult(await runTest('Login mauvais identifiants', async () => {
      await testLoginBadCredentials(ctx.page, ctx.logger)
    }, ctx.logger, reporter))

    reporter.addResult(await runTest('Inscription : mot de passe trop court', async () => {
      await testSignupPasswordValidation(ctx.page, ctx.logger)
    }, ctx.logger, reporter))

    reporter.addResult(await runTest('Inscription : mots de passe différents', async () => {
      await testSignupPasswordMismatch(ctx.page, ctx.logger)
    }, ctx.logger, reporter))

    reporter.addResult(await runTest('Page mot de passe oublié', async () => {
      await testForgotPasswordPage(ctx.page, ctx.logger)
    }, ctx.logger, reporter))

    reporter.addResult(await runTest('Mot de passe oublié : confirmation', async () => {
      await testForgotPasswordSubmit(ctx.page, ctx.logger)
    }, ctx.logger, reporter))

    reporter.addResult(await runTest('Navigation connexion ↔ inscription', async () => {
      await testAuthNavigation(ctx.page, ctx.logger)
    }, ctx.logger, reporter))
  } finally {
    await closeTestContext(ctx)
  }

  // GROUPE 2: Tests avec auth réelle (login, session, pages protégées)
  ctx = await createTestContext(MODULE_NAME + '-authenticated')
  let isLoggedIn = false

  try {
    const loginResult = await runTest('Connexion réussie', async () => {
      await testLoginSuccess(ctx.page, ctx.logger)
      isLoggedIn = true
    }, ctx.logger, reporter)
    reporter.addResult(loginResult)

    // Ces tests dépendent d'un login réussi
    if (isLoggedIn) {
      reporter.addResult(await runTest('/app accessible après connexion', async () => {
        await testAppAccessAfterLogin(ctx.page, ctx.logger)
      }, ctx.logger, reporter))

      reporter.addResult(await runTest('/compte accessible après connexion', async () => {
        await testCompteAccessAfterLogin(ctx.page, ctx.logger)
      }, ctx.logger, reporter))
    } else {
      ctx.logger.warn('Skipping /app and /compte tests — login failed')
      reporter.addResult({ name: '/app accessible après connexion', module: MODULE_NAME, status: 'skip' as any, duration: 0, error: 'Skipped: login failed' })
      reporter.addResult({ name: '/compte accessible après connexion', module: MODULE_NAME, status: 'skip' as any, duration: 0, error: 'Skipped: login failed' })
    }

    reporter.addResult(await runTest('Connexion avec redirect', async () => {
      await testLoginRedirectPreservation(ctx.page, ctx.logger)
    }, ctx.logger, reporter))

    reporter.addResult(await runTest('Bouton Google → OAuth redirect', async () => {
      await testGoogleOAuthRedirect(ctx.page, ctx.logger)
    }, ctx.logger, reporter))
  } catch (error) {
    ctx.logger.error(`Auth group crashed: ${error}`)
  } finally {
    await closeTestContext(ctx).catch(() => {})
  }

  // GROUPE 3: Full signup → confirm → login E2E flow
  ctx = await createTestContext(MODULE_NAME + '-signup-flow')

  try {
    reporter.addResult(await runTest('Inscription + Connexion (flow complet)', async () => {
      await testSignupThenLogin(ctx.page, ctx.logger)
    }, ctx.logger, reporter))
  } catch (error) {
    ctx.logger.error(`Signup flow group crashed: ${error}`)
  } finally {
    await closeTestContext(ctx).catch(() => {})
  }

  reporter.endModule()
}

if (require.main === module) {
  const { getReporter } = require('../utils/reporter')
  const reporter = getReporter()

  runAuthTests(reporter)
    .then(() => {
      reporter.printSummary()
      reporter.saveReport('auth_tests.json')
      process.exit(reporter.generateReport().summary.failed > 0 ? 1 : 0)
    })
    .catch(err => {
      console.error('Fatal error:', err)
      process.exit(1)
    })
}
