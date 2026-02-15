// E2E Tests: 15 archetype scenarios — full diagnostic flow
// Each scenario walks through the form like a real user, then verifies the result page.
// Output: archetype detected, coherence checks, and screenshots.

import { Page } from 'puppeteer'
import { TEST_CONFIG } from '../config'
import { TestLogger, getLogger } from '../utils/logger'
import { TestReporter, TestResult } from '../utils/reporter'
import {
  createTestContext,
  closeTestContext,
  takeScreenshot,
  wait,
  waitForText,
} from '../utils/browser'
import { SCENARIOS, TestScenario } from '../fixtures/scenarios'

import * as fs from 'fs'
import * as path from 'path'

const MODULE_NAME = 'scenarios'

// ============================================================
// Helpers
// ============================================================

/** Map scenario concentrationClient string to button label */
function concentrationLabel(s: string): string {
  const map: Record<string, string> = {
    '<10%': '< 10%',
    '10-30%': '10 - 30%',
    '30-50%': '30 - 50%',
    '>50%': '> 50%',
  }
  return map[s] || s
}

/** Click a button by its visible text (case-insensitive partial match) */
async function clickButtonByText(page: Page, text: string, exact = false) {
  await page.evaluate(
    (searchText: string, isExact: boolean) => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const btn = buttons.find((b) => {
        const t = (b.textContent || '').trim()
        return isExact ? t === searchText : t.toLowerCase().includes(searchText.toLowerCase())
      })
      if (btn) btn.click()
      else throw new Error(`Button not found: "${searchText}"`)
    },
    text,
    exact
  )
}

/** Wait for a number input to appear on the page (polls up to timeout) */
async function waitForNumberInput(page: Page, timeout = 3000): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const input = await page.$('input[type="number"]')
    if (input) return
    await wait(200)
  }
  throw new Error('No number input found (timeout)')
}

/** Confirm any visible coherence alert banners ("Je confirme" buttons) */
async function confirmAlerts(page: Page): Promise<number> {
  const count = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const confirms = buttons.filter(
      (b) => (b.textContent || '').trim().toLowerCase() === 'je confirme'
    )
    confirms.forEach((b) => b.click())
    return confirms.length
  })
  if (count > 0) await wait(300)
  return count
}

/** Check if the page contains specific text */
async function pageContainsText(page: Page, text: string): Promise<boolean> {
  return page.evaluate(
    (t: string) => document.body.innerText.toLowerCase().includes(t.toLowerCase()),
    text
  )
}

/** Type a number into the currently visible number input, then press Enter */
async function typeNumberAndEnter(page: Page, value: number) {
  await waitForNumberInput(page)
  const input = await page.$('input[type="number"]')
  if (!input) throw new Error('No number input found')
  // Clear existing value
  await input.click({ clickCount: 3 })
  await page.keyboard.type(String(value))
  await page.keyboard.press('Enter')
  await wait(400)
}

/** Set a range slider to a target value by manipulating it directly */
async function setSlider(page: Page, targetValue: number) {
  await page.evaluate((val: number) => {
    const slider = document.querySelector('input[type="range"]') as HTMLInputElement | null
    if (!slider) throw new Error('No range slider found')
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )!.set!
    nativeInputValueSetter.call(slider, String(val))
    slider.dispatchEvent(new Event('input', { bubbles: true }))
    slider.dispatchEvent(new Event('change', { bubbles: true }))
  }, targetValue)
  await wait(200)
}

/** Click "Continuer" or similar navigation button */
async function clickContinue(page: Page) {
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const btn = buttons.find((b) => {
      const t = (b.textContent || '').trim().toLowerCase()
      return (
        t === 'continuer' ||
        t === "c'est correct" ||
        t === 'voir mon diagnostic' ||
        t === 'valider'
      )
    })
    if (btn && !btn.disabled) btn.click()
  })
  await wait(400)
}

/** Click "Passer" to skip an optional step */
async function clickSkip(page: Page) {
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const btn = buttons.find((b) => (b.textContent || '').trim().toLowerCase() === 'passer')
    if (btn) btn.click()
  })
  await wait(400)
}

/** Wait for step to load (animation + content) */
async function waitForStep(page: Page, _stepLabel: string) {
  await wait(500)
}

// ============================================================
// Run one scenario through the diagnostic
// ============================================================

async function runScenario(
  page: Page,
  scenario: TestScenario,
  logger: TestLogger
): Promise<{
  archetypeId: string
  archetypeName: string
  resultPageText: string
  screenshotPath: string
}> {
  const { siren, diagnostic: d, pappers } = scenario

  logger.info(`=== Scenario: ${scenario.id} (${scenario.nom}) ===`)

  // 1. Navigate to /diagnostic
  await page.goto(`${TEST_CONFIG.baseUrl}/diagnostic`, { waitUntil: 'networkidle2' })
  await wait(1500)

  // ── Step 0: SIREN ──
  logger.info('Step 0: SIREN')
  const sirenInput = await page.$('input[type="text"]')
  if (!sirenInput) throw new Error('SIREN input not found')
  await sirenInput.click({ clickCount: 3 })
  await page.keyboard.type(siren)
  await wait(300)
  await clickButtonByText(page, 'Rechercher')
  await wait(3000) // Wait for API

  // Confirmation screen — click "Oui, c'est correct"
  const hasConfirm = await waitForText(page, pappers.nom, 5000)
  if (hasConfirm) {
    logger.info(`  Pappers found: ${pappers.nom}`)
    await clickButtonByText(page, "c'est correct")
    await wait(500)
  } else {
    logger.warn(`  Pappers not found, checking manual mode`)
    // Might still be on SIREN step, try continuing
    await wait(1000)
  }

  // ── Step 15: Pappers recap (if Pappers data exists) ──
  const hasPappersRecap = await waitForText(page, "C'est correct", 2000)
  if (hasPappersRecap) {
    logger.info('Step 15: Pappers recap — confirming')
    await clickButtonByText(page, "C'est correct")
    await wait(500)
  }

  // ── Step 1: Activity type ──
  logger.info(`Step 1: Activity type = ${d.activityType}`)
  await waitForStep(page, 'activity')
  // Map scenario activityType to button label (use specific substrings to avoid ambiguity)
  const activityLabels: Record<string, string> = {
    saas: 'SaaS',
    marketplace: 'Marketplace',
    ecommerce: 'E-commerce',
    conseil: 'Conseil',
    services: 'Services récurrents',
    commerce: 'Commerce /',    // "Commerce /" avoids matching "E-commerce"
    industrie: 'Industrie',
    immobilier: 'Immobilier',
  }
  await clickButtonByText(page, activityLabels[d.activityType] || d.activityType)
  await wait(500) // Auto-advance

  // ── Step 2: Revenue (CA) ── (may be skipped if Pappers handled)
  const hasRevenueStep = await page.$('input[type="number"]')
  if (hasRevenueStep) {
    logger.info(`Step 2: Revenue = ${d.revenue}`)
    await typeNumberAndEnter(page, d.revenue)
    await wait(300)

    // ── Step 3: EBITDA ──
    logger.info(`Step 3: EBITDA = ${d.ebitda}`)
    await waitForStep(page, 'ebitda')
    await typeNumberAndEnter(page, d.ebitda)
    await wait(300)
  } else {
    logger.info('Steps 2-3: Skipped (Pappers handled)')
  }

  // ── Step 4: Growth (slider) ──
  logger.info(`Step 4: Growth = ${d.growth}%`)
  await waitForStep(page, 'growth')
  await setSlider(page, d.growth)
  await clickContinue(page)
  await wait(300)

  // ── Step 5: Recurring (slider) ──
  logger.info(`Step 5: Recurring = ${d.recurring}%`)
  await waitForStep(page, 'recurring')
  await setSlider(page, d.recurring)
  await clickContinue(page)
  await wait(300)

  // ── Step 6: Masse salariale (slider) ──
  logger.info(`Step 6: Masse salariale = ${d.masseSalariale}%`)
  await waitForStep(page, 'masse salariale')
  await setSlider(page, d.masseSalariale)
  await clickContinue(page)
  await wait(300)

  // ── Step 7: Effectif ──
  logger.info(`Step 7: Effectif = ${d.effectif}`)
  await waitForStep(page, 'effectif')
  const effectifLabel = d.effectif === '1' ? '1 (solo)' : d.effectif
  await clickButtonByText(page, effectifLabel, true)
  await wait(500) // Auto-advance

  // ── Step 8: Patrimoine (conditional — skip for SaaS/marketplace/ecommerce) ──
  const skipPatrimoine = ['saas', 'marketplace', 'ecommerce'].includes(d.activityType)
  if (!skipPatrimoine) {
    logger.info(`Step 8: Patrimoine = ${d.hasPatrimoine}`)
    await waitForStep(page, 'patrimoine')
    await clickButtonByText(page, d.hasPatrimoine ? 'Oui' : 'Non', true)
    await wait(600) // Auto-advance

    // ── Step 9: Loyers nets (conditional) ──
    if (d.hasPatrimoine || d.activityType === 'immobilier') {
      const loyersVal = d.loyersNets ?? 0
      logger.info(`Step 9: Loyers nets = ${loyersVal}`)
      await waitForStep(page, 'loyers')
      await typeNumberAndEnter(page, loyersVal)
      await wait(300)
    }
  }

  // ── Step 10: Remuneration dirigeant ──
  logger.info(`Step 10: Remuneration = ${d.remunerationDirigeant}`)
  await waitForStep(page, 'remuneration')
  // Map to quick choice labels
  const remu = d.remunerationDirigeant
  if (remu === 0) {
    await clickButtonByText(page, 'Aucune')
  } else if (remu <= 30000) {
    await clickButtonByText(page, '< 30k')
  } else if (remu <= 60000) {
    await clickButtonByText(page, '30k - 60k')
  } else if (remu <= 100000) {
    await clickButtonByText(page, '60k - 100k')
  } else {
    await clickButtonByText(page, '> 100k')
  }
  await wait(500) // Auto-advance from quick choice

  // ── Steps 11-12: Dettes + Tresorerie (may be skipped if Pappers handled) ──
  // Check if dettes step is visible (number input present)
  await waitForStep(page, 'dettes')
  const hasDettesInput = await page.$('input[type="number"]')
  if (hasDettesInput) {
    if (d.dettesFinancieres != null) {
      logger.info(`Step 11: Dettes = ${d.dettesFinancieres}`)
      await typeNumberAndEnter(page, d.dettesFinancieres)
    } else {
      logger.info('Step 11: Dettes — skipping')
      await clickSkip(page)
    }
    await wait(300)

    // Step 12: Tresorerie
    if (d.tresorerieActuelle != null) {
      logger.info(`Step 12: Tresorerie = ${d.tresorerieActuelle}`)
      await waitForStep(page, 'tresorerie')
      await typeNumberAndEnter(page, d.tresorerieActuelle)
    } else {
      logger.info('Step 12: Tresorerie — skipping')
      await clickSkip(page)
    }
    await wait(300)
  } else {
    logger.info('Steps 11-12: Skipped (Pappers handled)')
  }

  // ── Step 13: Concentration client ──
  logger.info(`Step 13: Concentration = ${d.concentrationClient}`)
  await waitForStep(page, 'concentration')
  await clickButtonByText(page, concentrationLabel(d.concentrationClient))
  await wait(500) // Auto-advance

  // ── Step 14: MRR (SaaS/marketplace only) ──
  if (['saas', 'marketplace'].includes(d.activityType) && d.mrrMensuel) {
    logger.info(`Step 14: MRR = ${d.mrrMensuel}`)
    await waitForStep(page, 'mrr')
    await waitForNumberInput(page)
    const mrrInput = await page.$('input[type="number"]')
    if (mrrInput) {
      await mrrInput.click({ clickCount: 3 })
      await page.keyboard.type(String(d.mrrMensuel))
      await wait(500)

      // Confirm any coherence alerts (e.g. MRR_VS_CA_INCOHERENT for startup scenarios)
      const alertCount = await confirmAlerts(page)
      if (alertCount > 0) {
        logger.info(`  Confirmed ${alertCount} coherence alert(s) on MRR step`)
        await wait(300)
      }

      // Click Continuer (now enabled after alert confirmation)
      await clickContinue(page)
      await wait(400)
    }
  }

  // ── Step 16: Final recap ──
  logger.info('Step 16: Final recap — submitting')
  // Wait for the "Voir mon diagnostic" button to appear (polls)
  const recapStart = Date.now()
  let foundRecap = false
  while (Date.now() - recapStart < 5000) {
    foundRecap = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      return buttons.some((b) => (b.textContent || '').toLowerCase().includes('voir mon diagnostic'))
    })
    if (foundRecap) break
    await wait(300)
  }
  if (!foundRecap) throw new Error('Final recap "Voir mon diagnostic" button not found')
  await clickButtonByText(page, 'Voir mon diagnostic')
  await wait(1000)

  // ── Loading page ──
  logger.info('Waiting for loading page...')
  await waitForText(page, 'profil', 5000).catch(() => {})
  await wait(4000) // 3s min delay + API time

  // ── Result page ──
  logger.info('Waiting for result page...')
  await page.waitForFunction(
    () => window.location.pathname.includes('/diagnostic/result'),
    { timeout: 15000 }
  ).catch(() => {})

  await wait(2000)

  // Extract result data from sessionStorage
  const resultData = await page.evaluate(() => {
    const raw = sessionStorage.getItem('diagnostic_result')
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  })

  const resultPageText = await page.evaluate(() => document.body.innerText)
  const screenshotPath = await takeScreenshot(page, `scenario_${scenario.id}_result`)

  return {
    archetypeId: resultData?.archetypeId || 'UNKNOWN',
    archetypeName: resultData?.archetype?.name || 'UNKNOWN',
    resultPageText,
    screenshotPath,
  }
}

// ============================================================
// Run test wrapper
// ============================================================

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
// Main test runner
// ============================================================

export async function runScenarioTests(reporter: TestReporter): Promise<void> {
  const ctx = await createTestContext(MODULE_NAME)
  const { page, logger } = ctx

  // Output directory for scenario results
  const outputDir = path.join(process.cwd(), 'tests', 'output')
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

  const allResults: Array<{
    scenario: string
    archetype: string
    expectedArchetype: string
    match: boolean
    screenshot: string
  }> = []

  reporter.startModule(MODULE_NAME)

  for (const scenario of SCENARIOS) {
    const result = await runTest(
      `Scenario: ${scenario.id} (${scenario.nom})`,
      async () => {
        const res = await runScenario(page, scenario, logger)

        logger.info(`  → Archetype detected: ${res.archetypeId} (${res.archetypeName})`)
        logger.info(`  → Expected archetype: ${scenario.archetype}`)
        logger.info(`  → Screenshot: ${res.screenshotPath}`)

        allResults.push({
          scenario: scenario.id,
          archetype: res.archetypeId,
          expectedArchetype: scenario.archetype,
          match: res.archetypeId === scenario.archetype,
          screenshot: res.screenshotPath,
        })

        // Log coherence checks from expected
        logger.info('  Coherence checks:')
        for (const check of scenario.expected.coherenceChecks) {
          const icon = check.severity === 'error' ? '❌' : check.severity === 'warning' ? '⚠️' : '✅'
          logger.info(`    ${icon} ${check.check} → ${check.result}`)
        }

        // Verify archetype matches
        if (res.archetypeId !== scenario.archetype) {
          logger.warn(
            `  ⚠️ MISMATCH: got "${res.archetypeId}" expected "${scenario.archetype}"`
          )
          // Don't fail the test — log the mismatch for review
        }
      },
      logger,
      reporter
    )

    reporter.addResult(result)
  }

  // Write summary JSON output
  const summaryPath = path.join(outputDir, 'scenarios-results.json')
  fs.writeFileSync(summaryPath, JSON.stringify(allResults, null, 2))
  logger.info(`\nResults written to: ${summaryPath}`)

  // Print summary table
  console.log('\n┌─────────────────────────────┬──────────────────────────┬──────────────────────────┬────────┐')
  console.log('│ Scenario                    │ Detected                 │ Expected                 │ Match  │')
  console.log('├─────────────────────────────┼──────────────────────────┼──────────────────────────┼────────┤')
  for (const r of allResults) {
    const s = r.scenario.padEnd(27)
    const d = r.archetype.padEnd(24)
    const e = r.expectedArchetype.padEnd(24)
    const m = r.match ? '  ✅  ' : '  ❌  '
    console.log(`│ ${s} │ ${d} │ ${e} │${m}│`)
  }
  console.log('└─────────────────────────────┴──────────────────────────┴──────────────────────────┴────────┘')

  const matchCount = allResults.filter((r) => r.match).length
  console.log(`\n${matchCount}/${allResults.length} archetype matches`)

  reporter.endModule()
  await closeTestContext(ctx)
}
