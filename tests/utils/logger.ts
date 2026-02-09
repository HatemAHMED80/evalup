// Logger pour les tests - écrit dans des fichiers temporaires
import * as fs from 'fs'
import * as path from 'path'
import { TEST_CONFIG } from '../config'

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'TEST'

interface LogEntry {
  timestamp: string
  level: LogLevel
  module: string
  message: string
  data?: unknown
}

export class TestLogger {
  private logFile: string
  private module: string
  private entries: LogEntry[] = []

  constructor(module: string) {
    this.module = module
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    this.logFile = path.join(TEST_CONFIG.paths.logs, `${module}_${timestamp}.log`)

    // Créer le dossier logs si nécessaire
    if (!fs.existsSync(TEST_CONFIG.paths.logs)) {
      fs.mkdirSync(TEST_CONFIG.paths.logs, { recursive: true })
    }
  }

  private formatEntry(entry: LogEntry): string {
    const dataStr = entry.data ? `\n  Data: ${JSON.stringify(entry.data, null, 2)}` : ''
    return `[${entry.timestamp}] [${entry.level}] [${entry.module}] ${entry.message}${dataStr}`
  }

  private log(level: LogLevel, message: string, data?: unknown) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module: this.module,
      message,
      data,
    }

    this.entries.push(entry)
    const formatted = this.formatEntry(entry)

    // Écrire dans le fichier
    fs.appendFileSync(this.logFile, formatted + '\n')

    // Afficher aussi dans la console avec couleurs
    const colors: Record<LogLevel, string> = {
      INFO: '\x1b[36m',    // Cyan
      WARN: '\x1b[33m',    // Yellow
      ERROR: '\x1b[31m',   // Red
      DEBUG: '\x1b[90m',   // Gray
      TEST: '\x1b[32m',    // Green
    }
    console.log(`${colors[level]}${formatted}\x1b[0m`)
  }

  info(message: string, data?: unknown) {
    this.log('INFO', message, data)
  }

  warn(message: string, data?: unknown) {
    this.log('WARN', message, data)
  }

  error(message: string, data?: unknown) {
    this.log('ERROR', message, data)
  }

  debug(message: string, data?: unknown) {
    this.log('DEBUG', message, data)
  }

  test(message: string, data?: unknown) {
    this.log('TEST', message, data)
  }

  // Marquer le début d'un test
  testStart(testName: string) {
    this.log('TEST', `━━━ START: ${testName} ━━━`)
  }

  // Marquer la fin d'un test
  testEnd(testName: string, success: boolean, duration?: number) {
    const status = success ? '✅ PASS' : '❌ FAIL'
    const durationStr = duration ? ` (${duration}ms)` : ''
    this.log('TEST', `━━━ ${status}: ${testName}${durationStr} ━━━`)
  }

  // Récupérer le chemin du fichier log
  getLogFile(): string {
    return this.logFile
  }

  // Récupérer toutes les entrées
  getEntries(): LogEntry[] {
    return this.entries
  }

  // Générer un résumé
  getSummary(): { total: number; errors: number; warnings: number } {
    return {
      total: this.entries.length,
      errors: this.entries.filter(e => e.level === 'ERROR').length,
      warnings: this.entries.filter(e => e.level === 'WARN').length,
    }
  }
}

// Logger global pour les tests
let globalLogger: TestLogger | null = null

export function getLogger(module: string): TestLogger {
  return new TestLogger(module)
}

export function getGlobalLogger(): TestLogger {
  if (!globalLogger) {
    globalLogger = new TestLogger('global')
  }
  return globalLogger
}
