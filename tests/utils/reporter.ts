// Générateur de rapports de tests
import * as fs from 'fs'
import * as path from 'path'
import { TEST_CONFIG } from '../config'

export interface TestResult {
  name: string
  module: string
  status: 'pass' | 'fail' | 'skip'
  duration: number
  error?: string
  screenshot?: string
  logs?: string[]
}

export interface ModuleReport {
  module: string
  startTime: string
  endTime: string
  duration: number
  tests: TestResult[]
  passed: number
  failed: number
  skipped: number
}

export interface FullReport {
  timestamp: string
  environment: {
    baseUrl: string
    headless: boolean
    nodeVersion: string
  }
  modules: ModuleReport[]
  summary: {
    totalTests: number
    passed: number
    failed: number
    skipped: number
    duration: number
    successRate: string
  }
}

export class TestReporter {
  private results: TestResult[] = []
  private moduleReports: ModuleReport[] = []
  private currentModule: string = ''
  private moduleStartTime: Date = new Date()

  startModule(moduleName: string) {
    this.currentModule = moduleName
    this.moduleStartTime = new Date()
    this.results = []
  }

  addResult(result: TestResult) {
    this.results.push({
      ...result,
      module: this.currentModule,
    })
  }

  endModule() {
    const endTime = new Date()
    const moduleReport: ModuleReport = {
      module: this.currentModule,
      startTime: this.moduleStartTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: endTime.getTime() - this.moduleStartTime.getTime(),
      tests: [...this.results],
      passed: this.results.filter(r => r.status === 'pass').length,
      failed: this.results.filter(r => r.status === 'fail').length,
      skipped: this.results.filter(r => r.status === 'skip').length,
    }
    this.moduleReports.push(moduleReport)
    return moduleReport
  }

  generateReport(): FullReport {
    const allTests = this.moduleReports.flatMap(m => m.tests)
    const totalDuration = this.moduleReports.reduce((sum, m) => sum + m.duration, 0)

    const report: FullReport = {
      timestamp: new Date().toISOString(),
      environment: {
        baseUrl: TEST_CONFIG.baseUrl,
        headless: TEST_CONFIG.headless,
        nodeVersion: process.version,
      },
      modules: this.moduleReports,
      summary: {
        totalTests: allTests.length,
        passed: allTests.filter(t => t.status === 'pass').length,
        failed: allTests.filter(t => t.status === 'fail').length,
        skipped: allTests.filter(t => t.status === 'skip').length,
        duration: totalDuration,
        successRate: allTests.length > 0
          ? `${((allTests.filter(t => t.status === 'pass').length / allTests.length) * 100).toFixed(1)}%`
          : '0%',
      },
    }

    return report
  }

  saveReport(filename?: string): string {
    const report = this.generateReport()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const reportFile = filename || `report_${timestamp}.json`
    const reportPath = path.join(TEST_CONFIG.paths.reports, reportFile)

    // Créer le dossier si nécessaire
    if (!fs.existsSync(TEST_CONFIG.paths.reports)) {
      fs.mkdirSync(TEST_CONFIG.paths.reports, { recursive: true })
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    // Générer aussi un rapport texte lisible
    const textReport = this.generateTextReport(report)
    const textPath = reportPath.replace('.json', '.txt')
    fs.writeFileSync(textPath, textReport)

    return reportPath
  }

  private generateTextReport(report: FullReport): string {
    let text = `
╔════════════════════════════════════════════════════════════════╗
║                    RAPPORT DE TESTS E2E                        ║
╚════════════════════════════════════════════════════════════════╝

📅 Date: ${new Date(report.timestamp).toLocaleString('fr-FR')}
🌐 URL: ${report.environment.baseUrl}
🖥️  Mode: ${report.environment.headless ? 'Headless' : 'Visible'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 RÉSUMÉ GLOBAL
├─ Total tests: ${report.summary.totalTests}
├─ ✅ Réussis: ${report.summary.passed}
├─ ❌ Échoués: ${report.summary.failed}
├─ ⏭️  Ignorés: ${report.summary.skipped}
├─ ⏱️  Durée: ${(report.summary.duration / 1000).toFixed(2)}s
└─ 📈 Taux de réussite: ${report.summary.successRate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`

    for (const module of report.modules) {
      text += `
📦 MODULE: ${module.module.toUpperCase()}
├─ Durée: ${(module.duration / 1000).toFixed(2)}s
├─ Tests: ${module.tests.length} (✅ ${module.passed} / ❌ ${module.failed} / ⏭️ ${module.skipped})
│
`
      for (const test of module.tests) {
        const icon = test.status === 'pass' ? '✅' : test.status === 'fail' ? '❌' : '⏭️'
        text += `│  ${icon} ${test.name} (${test.duration}ms)\n`
        if (test.error) {
          text += `│     └─ Erreur: ${test.error}\n`
        }
      }
      text += '│\n'
    }

    text += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${report.summary.failed > 0 ? '⚠️  TESTS EN ÉCHEC:' : '🎉 TOUS LES TESTS SONT PASSÉS!'}
`

    if (report.summary.failed > 0) {
      const failedTests = report.modules.flatMap(m => m.tests.filter(t => t.status === 'fail'))
      for (const test of failedTests) {
        text += `\n❌ ${test.module} > ${test.name}\n   ${test.error || 'Erreur inconnue'}\n`
      }
    }

    return text
  }

  printSummary() {
    const report = this.generateReport()
    console.log(this.generateTextReport(report))
  }
}

// Instance globale
let globalReporter: TestReporter | null = null

export function getReporter(): TestReporter {
  if (!globalReporter) {
    globalReporter = new TestReporter()
  }
  return globalReporter
}

export function resetReporter() {
  globalReporter = new TestReporter()
  return globalReporter
}
