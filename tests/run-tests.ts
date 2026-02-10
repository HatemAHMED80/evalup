#!/usr/bin/env npx ts-node
/**
 * EvalUp E2E Test Runner
 *
 * Usage:
 *   npx ts-node tests/run-tests.ts              # Tous les tests
 *   npx ts-node tests/run-tests.ts chat         # Module chat uniquement
 *   npx ts-node tests/run-tests.ts payment      # Module payment uniquement
 *   npx ts-node tests/run-tests.ts chat payment # Plusieurs modules
 *
 * Options:
 *   TEST_HEADLESS=false npx ts-node tests/run-tests.ts  # Mode visible
 *   TEST_SLOW_MO=100 npx ts-node tests/run-tests.ts     # Ralentir (debug)
 */

import { resetReporter, TestReporter } from './utils/reporter'
import { getLogger } from './utils/logger'
import { runChatTests } from './e2e/chat.test'
import { runPaymentTests } from './e2e/payment.test'
import { runFullFlowTests } from './e2e/full-flow.test'
import { runNavigationTests } from './e2e/navigation.test'
import { runAccessControlTests } from './e2e/access-control.test'
import { runMobileTests } from './e2e/mobile.test'
import { runAIQualityTests } from './e2e/ai-quality.test'

// Définition des modules disponibles
const AVAILABLE_MODULES: Record<string, (reporter: TestReporter) => Promise<void>> = {
  navigation: runNavigationTests,
  'access-control': runAccessControlTests,
  mobile: runMobileTests,
  chat: runChatTests,
  payment: runPaymentTests,
  'ai-quality': runAIQualityTests,
  'full-flow': runFullFlowTests,
}

async function main() {
  const args = process.argv.slice(2)
  const logger = getLogger('test-runner')
  const reporter = resetReporter()

  // Déterminer les modules à exécuter
  let modulesToRun: string[] = []

  if (args.length === 0) {
    // Tous les modules
    modulesToRun = Object.keys(AVAILABLE_MODULES)
    logger.info('Running ALL test modules')
  } else {
    // Modules spécifiés
    modulesToRun = args.filter(arg => AVAILABLE_MODULES[arg])
    const unknown = args.filter(arg => !AVAILABLE_MODULES[arg])

    if (unknown.length > 0) {
      logger.warn(`Unknown modules ignored: ${unknown.join(', ')}`)
    }

    if (modulesToRun.length === 0) {
      console.error('No valid modules specified.')
      console.error(`Available modules: ${Object.keys(AVAILABLE_MODULES).join(', ')}`)
      process.exit(1)
    }

    logger.info(`Running modules: ${modulesToRun.join(', ')}`)
  }

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║              EVALUP E2E TEST SUITE                             ║
║                                                                ║
║  Modules: ${modulesToRun.join(', ').padEnd(42)}  ║
║  Mode: ${process.env.TEST_HEADLESS === 'false' ? 'Visible' : 'Headless'}                                         ║
╚════════════════════════════════════════════════════════════════╝
  `)

  // Exécuter chaque module
  for (const moduleName of modulesToRun) {
    logger.info(`\n${'═'.repeat(60)}`)
    logger.info(`Starting module: ${moduleName.toUpperCase()}`)
    logger.info(`${'═'.repeat(60)}\n`)

    try {
      await AVAILABLE_MODULES[moduleName](reporter)
    } catch (error) {
      logger.error(`Module ${moduleName} crashed: ${error}`)
    }
  }

  // Générer et afficher le rapport
  console.log('\n')
  reporter.printSummary()

  // Sauvegarder le rapport
  const reportPath = reporter.saveReport()
  console.log(`\n📄 Rapport sauvegardé: ${reportPath}`)

  // Lister les logs générés
  const fs = require('fs')
  const path = require('path')
  const logsDir = './tests/logs'
  if (fs.existsSync(logsDir)) {
    const logFiles = fs.readdirSync(logsDir).filter((f: string) => f.endsWith('.log'))
    if (logFiles.length > 0) {
      console.log('\n📋 Fichiers de logs:')
      logFiles.slice(-5).forEach((f: string) => {
        console.log(`   - ${path.join(logsDir, f)}`)
      })
    }
  }

  // Exit code basé sur les résultats
  const report = reporter.generateReport()
  const exitCode = report.summary.failed > 0 ? 1 : 0

  console.log(`\n${exitCode === 0 ? '✅' : '❌'} Tests terminés avec code: ${exitCode}`)
  process.exit(exitCode)
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
