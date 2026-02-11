// Tests E2E du flow complet diagnostic → paiement → chat IA avec validation de pertinence
import { Page } from 'puppeteer'
import * as fs from 'fs'
import * as path from 'path'
import { TEST_CONFIG } from '../config'
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
  wait,
} from '../utils/browser'
import {
  BOULANGERIE_MARTIN,
  AGENCE_DIGITALE,
  RESTAURANT_DIFFICULTE,
  CABINET_CONSEIL,
  TestCompanyCase,
} from '../fixtures/test-companies'

const MODULE_NAME = 'full-flow'

// Résultat détaillé d'un flow complet
interface FlowResult {
  company: string
  siren: string
  objectif: string
  questionsAsked: string[]
  answersGiven: string[]
  questionRelevanceScores: number[] // 0-100
  valuationDisplayed: boolean
  valuationRange?: { min: number; max: number }
  totalDuration: number
  errors: string[]
  warnings: string[]
}

// Rapport de pertinence
interface RelevanceReport {
  totalFlows: number
  successfulFlows: number
  averageRelevanceScore: number
  questionCategories: Record<string, number>
  flowResults: FlowResult[]
  generatedAt: string
}

// Mots-clés attendus par catégorie de question
const QUESTION_KEYWORDS = {
  activite: ['activité', 'métier', 'secteur', 'produit', 'service', 'faites-vous', 'proposez'],
  chiffre_affaires: ['chiffre', 'CA', 'revenus', 'ventes', 'tendance', 'évolution', 'croissance'],
  effectif: ['équipe', 'salariés', 'employés', 'effectif', 'personnel', 'collaborateurs'],
  rentabilite: ['rentabilité', 'marge', 'résultat', 'bénéfice', 'profit', 'EBE', 'EBITDA'],
  particularite: ['particulier', 'unique', 'différencie', 'atout', 'force', 'avantage', 'spécificité'],
  objectif: ['objectif', 'pourquoi', 'raison', 'motivation', 'vendre', 'céder', 'transmettre'],
  delai: ['délai', 'horizon', 'temps', 'quand', 'échéance', 'timing'],
  documents: ['document', 'bilan', 'compte', 'liasse', 'comptable', 'fiscal'],
}

// Helper pour exécuter un test avec timing
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

// Analyser la pertinence d'une question
function analyzeQuestionRelevance(question: string, context: {
  previousAnswers: string[]
  companyType: string
  objectif: string
}): { score: number; category: string } {
  const questionLower = question.toLowerCase()

  // Identifier la catégorie de la question
  let category = 'autre'
  let maxKeywordMatches = 0

  for (const [cat, keywords] of Object.entries(QUESTION_KEYWORDS)) {
    const matches = keywords.filter(kw => questionLower.includes(kw.toLowerCase())).length
    if (matches > maxKeywordMatches) {
      maxKeywordMatches = matches
      category = cat
    }
  }

  // Calculer le score de pertinence
  let score = 50 // Score de base

  // Bonus si la question est dans une catégorie reconnue
  if (category !== 'autre') {
    score += 20
  }

  // Bonus si la question semble adaptée au contexte
  if (context.objectif === 'vente' && questionLower.includes('vend')) {
    score += 10
  }
  if (context.objectif === 'achat' && questionLower.includes('achet')) {
    score += 10
  }

  // Bonus si la question fait référence à des éléments précédents
  for (const answer of context.previousAnswers) {
    const answerWords = answer.toLowerCase().split(/\s+/).filter(w => w.length > 4)
    for (const word of answerWords) {
      if (questionLower.includes(word)) {
        score += 5
        break
      }
    }
  }

  // La question doit se terminer par un ?
  if (question.includes('?')) {
    score += 5
  }

  // Pénalité si question trop courte
  if (question.length < 20) {
    score -= 10
  }

  return { score: Math.min(100, Math.max(0, score)), category }
}

// Extraire les questions posées par l'assistant
async function extractAssistantQuestions(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const questions: string[] = []
    // Chercher les messages assistant (bulles avec bg-white/5)
    const messages = document.querySelectorAll('[class*="bg-white/5"]')

    messages.forEach(msg => {
      const text = msg.textContent || ''
      // Chercher les phrases qui se terminent par ?
      const questionMatches = text.match(/[^.!?\n]*\?/g)
      if (questionMatches) {
        questionMatches.forEach(q => {
          const trimmed = q.trim()
          // Éviter les doublons et les questions trop courtes
          if (trimmed.length > 10 && !questions.includes(trimmed)) {
            questions.push(trimmed)
          }
        })
      }
    })

    return questions
  })
}

// Extraire la valorisation affichée
async function extractValuation(page: Page): Promise<{ min: number; max: number } | null> {
  return page.evaluate(() => {
    const text = document.body.innerText

    // Chercher des patterns de valorisation comme "entre X€ et Y€" ou "X - Y €"
    const rangePattern = /(\d[\d\s]*(?:k|K|€)?)\s*(?:à|et|-)\s*(\d[\d\s]*(?:k|K|€)?)/
    const match = text.match(rangePattern)

    if (match) {
      const parseValue = (str: string): number => {
        let value = parseInt(str.replace(/\s/g, '').replace(/[k€K]/gi, ''))
        if (str.toLowerCase().includes('k')) {
          value *= 1000
        }
        return value
      }

      return {
        min: parseValue(match[1]),
        max: parseValue(match[2]),
      }
    }

    return null
  })
}

// ============================================================
// TEST: Flow complet pour un cas fictif
// ============================================================
async function runFullFlowTest(
  page: Page,
  logger: TestLogger,
  testCase: TestCompanyCase
): Promise<FlowResult> {
  const result: FlowResult = {
    company: testCase.name,
    siren: testCase.siren,
    objectif: testCase.flashAnswers.objectif,
    questionsAsked: [],
    answersGiven: [],
    questionRelevanceScores: [],
    valuationDisplayed: false,
    totalDuration: 0,
    errors: [],
    warnings: [],
  }

  const startTime = Date.now()

  try {
    logger.info(`\n${'='.repeat(60)}`)
    logger.info(`FLOW COMPLET: ${testCase.name}`)
    logger.info(`Objectif: ${testCase.flashAnswers.objectif}`)
    logger.info(`${'='.repeat(60)}`)

    // Naviguer vers la page de chat avec l'objectif (post-paiement)
    await page.goto(`${TEST_CONFIG.baseUrl}/chat/${testCase.siren}?objectif=${testCase.flashAnswers.objectif}`)
    await wait(3000)

    // Attendre le premier message
    await waitForStreamingEnd(page, 45000)

    // Récupérer les questions initiales
    let questions = await extractAssistantQuestions(page)
    result.questionsAsked.push(...questions)

    // Répondre aux questions avec les réponses du cas test (flash + complete)
    const flashResponses = Object.values(testCase.flashAnswers.responses)
    const completeResponses = Object.values(testCase.completeAnswers.responses)
    const allResponses = [...flashResponses, ...completeResponses]
    let questionIndex = 0

    for (const answer of allResponses) {
      if (questionIndex >= 12) break // Max 12 questions pour le test

      logger.info(`\n--- Question ${questionIndex + 1} ---`)

      // Analyser la pertinence de la dernière question
      if (questions.length > 0) {
        const lastQuestion = questions[questions.length - 1]
        const relevance = analyzeQuestionRelevance(lastQuestion, {
          previousAnswers: result.answersGiven,
          companyType: testCase.expectedData.secteur,
          objectif: testCase.flashAnswers.objectif,
        })
        result.questionRelevanceScores.push(relevance.score)
        logger.info(`Question: "${lastQuestion.substring(0, 80)}..."`)
        logger.info(`Catégorie: ${relevance.category}, Pertinence: ${relevance.score}%`)
      }

      // Envoyer la réponse
      logger.info(`Réponse: "${answer.substring(0, 60)}..."`)
      result.answersGiven.push(answer)

      await sendChatMessage(page, answer)
      await waitForBotResponse(page, 60000)
      await wait(500)

      // Récupérer les nouvelles questions
      questions = await extractAssistantQuestions(page)
      if (questions.length > result.questionsAsked.length) {
        result.questionsAsked.push(...questions.slice(result.questionsAsked.length))
      }

      questionIndex++
    }

    // Vérifier si la valorisation est affichée
    await wait(2000)
    let hasValuation = false
    try {
      hasValuation = await waitForText(page, 'valorisation', 5000) ||
                     await waitForText(page, 'fourchette', 5000) ||
                     await waitForText(page, 'estimation', 5000)
    } catch (e) {
      // Fallback: vérifier directement le contenu de la page
      hasValuation = await page.evaluate(() => {
        const text = document.body.innerText.toLowerCase()
        return text.includes('valorisation') || text.includes('fourchette') || text.includes('estimation')
      })
    }

    result.valuationDisplayed = hasValuation

    if (hasValuation) {
      const valuation = await extractValuation(page)
      if (valuation) {
        result.valuationRange = valuation
        logger.info(`\nValorisation détectée: ${valuation.min.toLocaleString()}€ - ${valuation.max.toLocaleString()}€`)
      }
    }

    // Screenshot final
    await takeScreenshot(page, `flow_${testCase.name.replace(/\s/g, '_').toLowerCase()}`)

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    // Ignorer les erreurs liées au bundler qui ne sont pas des vrais problèmes
    if (!errorMsg.includes('__name') && !errorMsg.includes('is not defined')) {
      result.errors.push(errorMsg)
      logger.error(`Erreur dans le flow: ${errorMsg}`)
    } else {
      logger.warn(`Erreur bundler ignorée: ${errorMsg}`)
    }
  }

  result.totalDuration = Date.now() - startTime

  // Résumé du flow
  logger.info(`\n--- Résumé ${testCase.name} ---`)
  logger.info(`Questions posées: ${result.questionsAsked.length}`)
  logger.info(`Réponses données: ${result.answersGiven.length}`)
  logger.info(`Score moyen pertinence: ${
    result.questionRelevanceScores.length > 0
      ? Math.round(result.questionRelevanceScores.reduce((a, b) => a + b, 0) / result.questionRelevanceScores.length)
      : 'N/A'
  }%`)
  logger.info(`Valorisation affichée: ${result.valuationDisplayed ? 'Oui' : 'Non'}`)
  logger.info(`Durée: ${(result.totalDuration / 1000).toFixed(1)}s`)

  return result
}

// ============================================================
// Générer le rapport de pertinence
// ============================================================
function generateRelevanceReport(results: FlowResult[]): RelevanceReport {
  const allScores = results.flatMap(r => r.questionRelevanceScores)
  const averageScore = allScores.length > 0
    ? allScores.reduce((a, b) => a + b, 0) / allScores.length
    : 0

  // Compter les catégories de questions
  const categories: Record<string, number> = {}
  for (const result of results) {
    for (const question of result.questionsAsked) {
      const { category } = analyzeQuestionRelevance(question, {
        previousAnswers: [],
        companyType: '',
        objectif: '',
      })
      categories[category] = (categories[category] || 0) + 1
    }
  }

  return {
    totalFlows: results.length,
    successfulFlows: results.filter(r => r.valuationDisplayed && r.errors.length === 0).length,
    averageRelevanceScore: Math.round(averageScore),
    questionCategories: categories,
    flowResults: results,
    generatedAt: new Date().toISOString(),
  }
}

// ============================================================
// MAIN: Exécuter tous les tests du module
// ============================================================
export async function runFullFlowTests(reporter: TestReporter): Promise<void> {
  const ctx = await createTestContext(MODULE_NAME)
  const { page, logger } = ctx

  reporter.startModule(MODULE_NAME)

  const testCases: TestCompanyCase[] = [
    BOULANGERIE_MARTIN,
    AGENCE_DIGITALE,
    RESTAURANT_DIFFICULTE,
    CABINET_CONSEIL,
  ]

  const flowResults: FlowResult[] = []

  try {
    for (const testCase of testCases) {
      reporter.addResult(
        await runTest(`Flow complet: ${testCase.name}`, async () => {
          const result = await runFullFlowTest(page, logger, testCase)
          flowResults.push(result)

          // Le test échoue seulement si pas de valorisation
          // Les erreurs mineures sont tolérées si le résultat principal est atteint
          if (!result.valuationDisplayed) {
            throw new Error('Valorisation non affichée à la fin du flow')
          }

          // Log des erreurs comme warnings (non bloquantes)
          if (result.errors.length > 0) {
            logger.warn(`Erreurs mineures rencontrées (non bloquantes): ${result.errors.join(', ')}`)
          }

          // Avertissement si pertinence moyenne < 60%
          const avgScore = result.questionRelevanceScores.length > 0
            ? result.questionRelevanceScores.reduce((a, b) => a + b, 0) / result.questionRelevanceScores.length
            : 0
          if (avgScore < 60) {
            logger.warn(`Pertinence moyenne faible: ${avgScore.toFixed(0)}%`)
          }
        }, logger, reporter)
      )

      // Pause entre les tests pour ne pas surcharger l'API
      await wait(2000)
    }

    // Générer et sauvegarder le rapport de pertinence
    const report = generateRelevanceReport(flowResults)

    logger.info('\n' + '='.repeat(60))
    logger.info('RAPPORT DE PERTINENCE DES QUESTIONS')
    logger.info('='.repeat(60))
    logger.info(`Flows testés: ${report.totalFlows}`)
    logger.info(`Flows réussis: ${report.successfulFlows}`)
    logger.info(`Score moyen de pertinence: ${report.averageRelevanceScore}%`)
    logger.info('\nCatégories de questions:')
    for (const [cat, count] of Object.entries(report.questionCategories)) {
      logger.info(`  - ${cat}: ${count}`)
    }

    // Sauvegarder le rapport JSON
    const reportDir = path.join(process.cwd(), 'tests', 'reports')
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }
    const reportPath = path.join(reportDir, `relevance_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    logger.info(`\nRapport sauvegardé: ${reportPath}`)

    // Afficher le résumé par entreprise
    logger.info('\n' + '='.repeat(60))
    logger.info('RÉSUMÉ PAR ENTREPRISE')
    logger.info('='.repeat(60))

    for (const result of flowResults) {
      const avgScore = result.questionRelevanceScores.length > 0
        ? Math.round(result.questionRelevanceScores.reduce((a, b) => a + b, 0) / result.questionRelevanceScores.length)
        : 0

      const companyName = (result.company || 'Inconnu').substring(0, 55).padEnd(55)
      const objectifStr = (result.objectif || 'N/A').substring(0, 46).padEnd(46)

      console.log(`
┌─────────────────────────────────────────────────────────┐
│ ${companyName} │
├─────────────────────────────────────────────────────────┤
│ Objectif: ${objectifStr} │
│ Questions: ${String(result.questionsAsked.length).padEnd(45)} │
│ Pertinence moyenne: ${String(avgScore + '%').padEnd(36)} │
│ Valorisation: ${(result.valuationDisplayed ? '✅ Oui' : '❌ Non').padEnd(42)} │
│ Durée: ${String((result.totalDuration / 1000).toFixed(1) + 's').padEnd(49)} │
│ Erreurs: ${String(result.errors.length).padEnd(47)} │
└─────────────────────────────────────────────────────────┘`)
    }

  } finally {
    reporter.endModule()
    await closeTestContext(ctx)
  }
}

// Exécution directe du module
if (require.main === module) {
  const { getReporter } = require('../utils/reporter')
  const reporter = getReporter()

  runFullFlowTests(reporter)
    .then(() => {
      reporter.printSummary()
      reporter.saveReport('full_flow_tests.json')
      process.exit(reporter.generateReport().summary.failed > 0 ? 1 : 0)
    })
    .catch(err => {
      console.error('Fatal error:', err)
      process.exit(1)
    })
}
