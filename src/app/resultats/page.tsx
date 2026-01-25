// Page des résultats d'évaluation

import Link from 'next/link'
import { calculerEvaluation, formaterEuros } from '@/lib/evaluation'
import { calculerStatistiquesSecteur } from '@/lib/transactions'
import { DonneesEntreprise } from '@/lib/types'
import { parseReponsesFromParams, NOMS_CATEGORIES, type CategorieQuestion } from '@/lib/scoring-qualitatif'
import ResultCard from '@/components/ResultCard'
import ValuationChart from '@/components/ValuationChart'

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function ResultatsPage({ searchParams }: PageProps) {
  const params = await searchParams

  // Vérification des paramètres requis
  if (!params.nom || !params.secteur || !params.ca || !params.ebitda || !params.employes || !params.anciennete || !params.localisation) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Données manquantes
          </h1>
          <p className="text-gray-600 mb-6">
            Veuillez remplir le formulaire d&apos;évaluation pour voir les résultats.
          </p>
          <Link
            href="/"
            className="inline-block bg-[#1e3a5f] text-white px-6 py-3 rounded-lg hover:bg-[#2d5a8f] transition-colors"
          >
            Retour au formulaire
          </Link>
        </div>
      </div>
    )
  }

  // Construction des données de l'entreprise
  const donnees: DonneesEntreprise = {
    nom: params.nom,
    secteur: params.secteur,
    chiffreAffaires: parseFloat(params.ca),
    ebitda: parseFloat(params.ebitda),
    nombreEmployes: parseInt(params.employes),
    anciennete: parseInt(params.anciennete),
    localisation: params.localisation,
  }

  // Récupérer les statistiques de marché (côté serveur uniquement)
  let statsMarche = null
  try {
    statsMarche = await calculerStatistiquesSecteur(donnees.secteur)
  } catch {
    // Si erreur, on continue sans les données de marché
  }

  // Parser les réponses qualitatives depuis les params URL
  const paramsRecord: Record<string, string> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value) paramsRecord[key] = value
  }
  const reponsesQualitatives = parseReponsesFromParams(paramsRecord)

  // Calcul de l'évaluation (avec données de marché et score qualitatif si disponibles)
  let resultat
  try {
    resultat = calculerEvaluation(donnees, { statsMarche, reponsesQualitatives })
  } catch {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Erreur de calcul
          </h1>
          <p className="text-gray-600 mb-6">
            Une erreur s&apos;est produite lors du calcul. Vérifiez vos données.
          </p>
          <Link
            href="/"
            className="inline-block bg-[#1e3a5f] text-white px-6 py-3 rounded-lg hover:bg-[#2d5a8f] transition-colors"
          >
            Retour au formulaire
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-10">
          <p className="text-sm text-[#10b981] font-semibold mb-2 uppercase tracking-wide">
            Résultat de l&apos;évaluation
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1e3a5f] mb-2">
            {donnees.nom}
          </h1>
          <p className="text-gray-600">
            Secteur : {resultat.secteur.nom} • {donnees.localisation}
          </p>
        </div>

        {/* Valorisation principale */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <ResultCard
            titre="Estimation basse"
            valeur={formaterEuros(resultat.valorisation.basse)}
            variante="secondary"
          />
          <ResultCard
            titre="Estimation moyenne"
            valeur={formaterEuros(resultat.valorisation.moyenne)}
            description="Valorisation recommandée"
            variante="highlight"
          />
          <ResultCard
            titre="Estimation haute"
            valeur={formaterEuros(resultat.valorisation.haute)}
            variante="secondary"
          />
        </div>

        {/* Graphique */}
        <div className="mb-8">
          <ValuationChart
            basse={resultat.valorisation.basse}
            moyenne={resultat.valorisation.moyenne}
            haute={resultat.valorisation.haute}
          />
        </div>

        {/* Détail par méthode */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Détail par méthode de calcul
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Multiple du CA</p>
              <p className="text-xl font-bold text-[#1e3a5f]">
                {formaterEuros(resultat.methodes.multipleCA.valeurBasse)} - {formaterEuros(resultat.methodes.multipleCA.valeurHaute)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Multiple utilisé : {resultat.methodes.multipleCA.multipleUtilise.min}x - {resultat.methodes.multipleCA.multipleUtilise.max}x
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Multiple de l&apos;EBITDA</p>
              <p className="text-xl font-bold text-[#1e3a5f]">
                {formaterEuros(resultat.methodes.multipleEBITDA.valeurBasse)} - {formaterEuros(resultat.methodes.multipleEBITDA.valeurHaute)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Multiple utilisé : {resultat.methodes.multipleEBITDA.multipleUtilise.min}x - {resultat.methodes.multipleEBITDA.multipleUtilise.max}x
              </p>
            </div>
          </div>
        </div>

        {/* Ajustements */}
        {resultat.ajustements.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Facteurs d&apos;ajustement
            </h3>
            <div className="space-y-3">
              {resultat.ajustements.map((ajustement, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg flex items-center justify-between ${
                    ajustement.impact === 'positif'
                      ? 'bg-green-50 border border-green-100'
                      : ajustement.impact === 'negatif'
                      ? 'bg-red-50 border border-red-100'
                      : 'bg-gray-50 border border-gray-100'
                  }`}
                >
                  <div>
                    <p className={`font-medium ${
                      ajustement.impact === 'positif'
                        ? 'text-green-800'
                        : ajustement.impact === 'negatif'
                        ? 'text-red-800'
                        : 'text-gray-800'
                    }`}>
                      {ajustement.nom}
                    </p>
                    <p className="text-sm text-gray-500">{ajustement.description}</p>
                  </div>
                  <span className={`font-bold text-lg ${
                    ajustement.impact === 'positif'
                      ? 'text-green-600'
                      : ajustement.impact === 'negatif'
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}>
                    {ajustement.pourcentage > 0 ? '+' : ''}{ajustement.pourcentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Score qualitatif (si disponible) */}
        {resultat.scoreQualitatif && (
          <div className="bg-purple-50 rounded-xl p-6 border border-purple-200 mb-8">
            <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Scoring Qualitatif
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Impact sur la valorisation : <span className={`font-bold ${resultat.scoreQualitatif.impactValorisationPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {resultat.scoreQualitatif.impactValorisationPct > 0 ? '+' : ''}{resultat.scoreQualitatif.impactValorisationPct}%
              </span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {resultat.scoreQualitatif.detailParCategorie.map((cat) => (
                <div key={cat.categorie} className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">{cat.nom}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            cat.score >= 70 ? 'bg-green-500' : cat.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${cat.score}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{cat.score}/100</span>
                    </div>
                    <span className={`text-sm font-bold ${cat.impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {cat.impact > 0 ? '+' : ''}{cat.impact}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Données de marché (si disponibles) */}
        {resultat.donneesMarche && (
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 mb-8">
            <h3 className="text-lg font-semibold text-[#1e3a5f] mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Données de marché
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Basé sur {resultat.donneesMarche.nombreTransactions} transaction{resultat.donneesMarche.nombreTransactions > 1 ? 's' : ''} réelle{resultat.donneesMarche.nombreTransactions > 1 ? 's' : ''} du secteur (source : {resultat.donneesMarche.source})
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Prix moyen de cession</p>
                <p className="text-xl font-bold text-[#1e3a5f]">
                  {formaterEuros(resultat.donneesMarche.prixMoyenMarche)}
                </p>
              </div>
              {resultat.donneesMarche.multipleCAMarche && (
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Multiple CA moyen du marché</p>
                  <p className="text-xl font-bold text-[#1e3a5f]">
                    {resultat.donneesMarche.multipleCAMarche}x
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Score global */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Score global de l&apos;entreprise
          </h3>
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke={resultat.scoreGlobal >= 70 ? '#10b981' : resultat.scoreGlobal >= 40 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${resultat.scoreGlobal * 2.51} 251`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-[#1e3a5f]">
                {resultat.scoreGlobal}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-800">
                {resultat.scoreGlobal >= 70
                  ? 'Excellent profil'
                  : resultat.scoreGlobal >= 50
                  ? 'Bon profil'
                  : resultat.scoreGlobal >= 30
                  ? 'Profil moyen'
                  : 'Profil à améliorer'}
              </p>
              <p className="text-sm text-gray-500">
                Ce score reflète l&apos;attractivité globale de votre entreprise pour un acquéreur potentiel.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-[#1e3a5f] text-[#1e3a5f] rounded-lg hover:bg-[#1e3a5f] hover:text-white transition-colors font-medium"
          >
            Nouvelle évaluation
          </Link>
          <button
            disabled
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed font-medium"
          >
            Télécharger le rapport PDF (bientôt)
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-sm text-gray-500 mt-8 max-w-lg mx-auto">
          Cette estimation est fournie à titre indicatif et ne constitue pas un conseil financier.
          Pour une évaluation précise, consultez un expert en transmission d&apos;entreprise.
        </p>
      </div>
    </div>
  )
}
