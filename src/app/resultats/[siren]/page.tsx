// Page des résultats d'évaluation dynamique basée sur SIREN
// Récupère les données via Pappers API et affiche l'analyse complète

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { rechercherEntreprise, PappersError, isPappersConfigured } from '@/lib/pappers'
import { analyserEntreprise, calculerValorisationComplete, type AnalyseFinanciere, type ValorisationComplete } from '@/lib/analyse-financiere'
import { getSecteurByCode } from '@/lib/secteurs'
import { formaterEuros } from '@/lib/evaluation'

interface PageProps {
  params: Promise<{ siren: string }>
}

export default async function ResultatsSirenPage({ params }: PageProps) {
  const { siren } = await params

  // Vérifier la configuration Pappers
  if (!isPappersConfigured()) {
    return (
      <div className="section bg-gray-50">
        <div className="container-small text-center">
          <div className="card p-8">
            <h1 className="heading-2 text-red-600 mb-4">
              API non configurée
            </h1>
            <p className="text-gray-600 mb-6">
              L&apos;API Pappers n&apos;est pas configurée. Ajoutez PAPPERS_API_KEY dans .env.local
            </p>
            <Link href="/" className="btn-secondary">
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Récupérer les données de l'entreprise
  let entreprise
  let analyse: AnalyseFinanciere
  let valorisation: ValorisationComplete | null

  try {
    entreprise = await rechercherEntreprise(siren)
    analyse = analyserEntreprise(entreprise)
    valorisation = calculerValorisationComplete(entreprise, analyse)
  } catch (error) {
    if (error instanceof PappersError) {
      if (error.code === 'NOT_FOUND') {
        notFound()
      }
      return (
        <div className="section bg-gray-50">
          <div className="container-small text-center">
            <div className="card p-8">
              <h1 className="heading-2 text-red-600 mb-4">
                Erreur
              </h1>
              <p className="text-gray-600 mb-6">
                {error.message}
              </p>
              <Link href="/" className="btn-secondary">
                Retour à l&apos;accueil
              </Link>
            </div>
          </div>
        </div>
      )
    }
    throw error
  }

  const secteur = entreprise.secteurEvalup ? getSecteurByCode(entreprise.secteurEvalup) : null

  return (
    <div className="section-small bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#1e3a5f] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Nouvelle recherche
          </Link>
        </div>

        {/* Section 1: Carte Entreprise */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1e3a5f] mb-2">
                {entreprise.nom}
              </h1>
              {entreprise.sigle && (
                <p className="text-gray-500 mb-2">{entreprise.sigle}</p>
              )}
              <p className="text-gray-600">
                {secteur?.nom || entreprise.libelleNaf}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {entreprise.entrepriseCessee && (
                <span className="badge-error">
                  Cessée
                </span>
              )}
              {analyse.tendance === 'croissance' && (
                <span className="badge-success">
                  En croissance
                </span>
              )}
              {analyse.tendance === 'decroissance' && (
                <span className="badge-warning">
                  En déclin
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div>
              <p className="text-sm text-gray-500">SIREN</p>
              <p className="font-medium text-gray-900">{entreprise.siren}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Création</p>
              <p className="font-medium text-gray-900">{entreprise.dateCreation}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Ancienneté</p>
              <p className="font-medium text-gray-900">{entreprise.anciennete} ans</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Effectif</p>
              <p className="font-medium text-gray-900">
                {entreprise.effectif ? `${entreprise.effectif} employé(s)` : entreprise.trancheEffectif || 'Non renseigné'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Localisation</p>
              <p className="font-medium text-gray-900">{entreprise.ville}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Région</p>
              <p className="font-medium text-gray-900">{entreprise.region || 'Non identifiée'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Forme juridique</p>
              <p className="font-medium text-gray-900">{entreprise.formeJuridique || 'Non renseigné'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Capital</p>
              <p className="font-medium text-gray-900">
                {entreprise.capital ? formaterEuros(entreprise.capital) : 'Non renseigné'}
              </p>
            </div>
          </div>

          {/* Dirigeants */}
          {entreprise.dirigeants.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-2">Dirigeant(s)</p>
              <div className="flex flex-wrap gap-2">
                {entreprise.dirigeants.slice(0, 3).map((dirigeant, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-sm">
                    {dirigeant.nom} <span className="text-gray-500 ml-1">({dirigeant.qualite})</span>
                  </span>
                ))}
                {entreprise.dirigeants.length > 3 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-gray-500 text-sm">
                    +{entreprise.dirigeants.length - 3} autre(s)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Synthèse financière */}
        {entreprise.bilans.length > 0 && (
          <div className="card p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#1e3a5f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Synthèse financière
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-500">Indicateur</th>
                    {entreprise.bilans.map((bilan) => (
                      <th key={bilan.annee} className="text-right py-3 px-2 font-medium text-gray-500">
                        {bilan.annee}
                      </th>
                    ))}
                    {entreprise.evolutionCA !== null && (
                      <th className="text-right py-3 px-2 font-medium text-gray-500">Évolution</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-3 px-2 text-gray-700">Chiffre d&apos;affaires</td>
                    {entreprise.bilans.map((bilan) => (
                      <td key={bilan.annee} className="text-right py-3 px-2 font-medium text-gray-900">
                        {formaterEuros(bilan.chiffreAffaires)}
                      </td>
                    ))}
                    {entreprise.evolutionCA !== null && (
                      <td className={`text-right py-3 px-2 font-medium ${entreprise.evolutionCA >= 0 ? 'text-[#10b981]' : 'text-red-600'}`}>
                        {entreprise.evolutionCA >= 0 ? '+' : ''}{entreprise.evolutionCA}%
                      </td>
                    )}
                  </tr>
                  <tr>
                    <td className="py-3 px-2 text-gray-700">EBITDA</td>
                    {entreprise.bilans.map((bilan) => (
                      <td key={bilan.annee} className="text-right py-3 px-2 font-medium text-gray-900">
                        {formaterEuros(bilan.ebitda)}
                      </td>
                    ))}
                    <td></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-2 text-gray-700">Résultat net</td>
                    {entreprise.bilans.map((bilan) => (
                      <td key={bilan.annee} className={`text-right py-3 px-2 font-medium ${bilan.resultatNet >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                        {formaterEuros(bilan.resultatNet)}
                      </td>
                    ))}
                    {entreprise.evolutionResultat !== null && (
                      <td className={`text-right py-3 px-2 font-medium ${entreprise.evolutionResultat >= 0 ? 'text-[#10b981]' : 'text-red-600'}`}>
                        {entreprise.evolutionResultat >= 0 ? '+' : ''}{entreprise.evolutionResultat}%
                      </td>
                    )}
                  </tr>
                  <tr>
                    <td className="py-3 px-2 text-gray-700">Marge nette</td>
                    {entreprise.bilans.map((bilan) => (
                      <td key={bilan.annee} className={`text-right py-3 px-2 font-medium ${bilan.margeNette >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                        {bilan.margeNette}%
                      </td>
                    ))}
                    <td></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-2 text-gray-700">Trésorerie</td>
                    {entreprise.bilans.map((bilan) => (
                      <td key={bilan.annee} className={`text-right py-3 px-2 font-medium ${bilan.tresorerie >= 0 ? 'text-[#10b981]' : 'text-red-600'}`}>
                        {formaterEuros(bilan.tresorerie)}
                      </td>
                    ))}
                    <td></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-2 text-gray-700">Dette nette</td>
                    {entreprise.bilans.map((bilan) => (
                      <td key={bilan.annee} className={`text-right py-3 px-2 font-medium ${bilan.detteNette <= 0 ? 'text-[#10b981]' : 'text-red-600'}`}>
                        {formaterEuros(bilan.detteNette)}
                      </td>
                    ))}
                    <td></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-2 text-gray-700">Capitaux propres</td>
                    {entreprise.bilans.map((bilan) => (
                      <td key={bilan.annee} className={`text-right py-3 px-2 font-medium ${bilan.capitauxPropres >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                        {formaterEuros(bilan.capitauxPropres)}
                      </td>
                    ))}
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 3: Valorisation */}
        {valorisation ? (
          <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8f] rounded-2xl p-6 text-white mb-8">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Estimation de la valorisation
            </h2>

            {/* Slider de valorisation */}
            <div className="mb-8">
              <div className="flex justify-between text-sm mb-2">
                <span>Estimation basse</span>
                <span>Estimation haute</span>
              </div>
              <div className="relative h-4 bg-white/20 rounded-full">
                <div className="absolute inset-y-0 left-0 bg-[#10b981] rounded-full" style={{ width: '50%' }} />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center"
                  style={{ left: '50%', transform: 'translate(-50%, -50%)' }}
                >
                  <div className="w-2 h-2 bg-[#1e3a5f] rounded-full" />
                </div>
              </div>
              <div className="flex justify-between mt-2">
                <span className="font-semibold">{formaterEuros(valorisation.prixCession.bas)}</span>
                <span className="text-2xl font-bold text-[#10b981]">{formaterEuros(valorisation.prixCession.moyen)}</span>
                <span className="font-semibold">{formaterEuros(valorisation.prixCession.haut)}</span>
              </div>
            </div>

            {/* Détail des ajustements */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-sm text-white/70 mb-1">Valeur d&apos;entreprise (EV)</p>
                <p className="text-xl font-bold">{formaterEuros(valorisation.valeurEntreprise.moyenne)}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-sm text-white/70 mb-1">Trésorerie nette</p>
                <p className={`text-xl font-bold ${valorisation.ajustements.tresorerie - valorisation.ajustements.detteNette >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {valorisation.ajustements.tresorerie - valorisation.ajustements.detteNette >= 0 ? '+' : ''}
                  {formaterEuros(valorisation.ajustements.tresorerie - valorisation.ajustements.detteNette)}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-sm text-white/70 mb-1">Ajustement BFR</p>
                <p className={`text-xl font-bold ${valorisation.ajustements.ajustementBfr >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {valorisation.ajustements.ajustementBfr >= 0 ? '+' : ''}
                  {formaterEuros(valorisation.ajustements.ajustementBfr)}
                </p>
              </div>
            </div>

            {/* Hypothèses */}
            <div className="text-sm text-white/70">
              <p className="font-medium text-white mb-2">Hypothèses de calcul :</p>
              <ul className="list-disc list-inside space-y-1">
                {valorisation.hypotheses.map((hypothese, index) => (
                  <li key={index}>{hypothese}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="card p-6 mb-8 text-center bg-gray-100">
            <p className="text-gray-600">
              Données financières insuffisantes pour calculer une valorisation.
            </p>
          </div>
        )}

        {/* Section 4: CTA Acquéreurs */}
        <div className="bg-gradient-to-r from-[#c9a227] to-[#d4b84d] rounded-2xl p-8 mb-8 text-center relative overflow-hidden">
          {/* Motif décoratif */}
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
            <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
              <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="2"/>
              <circle cx="100" cy="100" r="50" stroke="white" strokeWidth="2"/>
            </svg>
          </div>

          <div className="relative">
            {/* Avatars acquéreurs */}
            <div className="flex justify-center -space-x-3 mb-4">
              <div className="w-10 h-10 bg-[#1e3a5f] rounded-full border-2 border-white flex items-center justify-center text-white text-sm font-medium">JD</div>
              <div className="w-10 h-10 bg-[#10b981] rounded-full border-2 border-white flex items-center justify-center text-white text-sm font-medium">ML</div>
              <div className="w-10 h-10 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white text-sm font-medium">PT</div>
              <div className="w-10 h-10 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center text-white text-sm font-medium">SR</div>
              <div className="w-10 h-10 bg-gray-700 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium">+23</div>
            </div>

            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
              27 acquéreurs recherchent des entreprises comme la vôtre
            </h3>
            <p className="text-white/90 mb-6 max-w-lg mx-auto">
              Entrepreneurs, fonds d&apos;investissement, repreneurs... Ils sont prêts à échanger avec vous en toute confidentialité.
            </p>

            <button className="inline-flex items-center gap-3 px-8 py-4 bg-white text-[#1e3a5f] rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Me connecter aux acquéreurs
            </button>

            <p className="text-white/70 text-sm mt-4">
              Gratuit • Confidentiel • Sans engagement
            </p>
          </div>
        </div>

        {/* Section 5: Points clés */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Points forts */}
          <div className="bg-[#10b981]/5 rounded-2xl p-6 border border-[#10b981]/20">
            <h3 className="text-lg font-semibold text-[#10b981] mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Points forts ({analyse.pointsForts.length})
            </h3>
            {analyse.pointsForts.length > 0 ? (
              <div className="space-y-3">
                {analyse.pointsForts.map((point, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                      point.importance === 'haute' ? 'bg-[#10b981]' :
                      point.importance === 'moyenne' ? 'bg-[#10b981]/70' : 'bg-[#10b981]/50'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-800">{point.titre}</p>
                      <p className="text-sm text-gray-600">{point.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm">Aucun point fort identifié</p>
            )}
          </div>

          {/* Points de vigilance */}
          <div className="bg-[#c9a227]/5 rounded-2xl p-6 border border-[#c9a227]/20">
            <h3 className="text-lg font-semibold text-[#c9a227] mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Points de vigilance ({analyse.pointsVigilance.length})
            </h3>
            {analyse.pointsVigilance.length > 0 ? (
              <div className="space-y-3">
                {analyse.pointsVigilance.map((point, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                      point.importance === 'haute' ? 'bg-[#c9a227]' :
                      point.importance === 'moyenne' ? 'bg-[#c9a227]/70' : 'bg-[#c9a227]/50'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-800">{point.titre}</p>
                      <p className="text-sm text-gray-600">{point.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm">Aucun point de vigilance identifié</p>
            )}
          </div>
        </div>

        {/* Section 5: Détail des méthodes */}
        {valorisation && (
          <div className="card p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Détail par méthode de calcul
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Multiple du CA</p>
                <p className="text-xl font-bold text-[#1e3a5f]">
                  {formaterEuros(valorisation.methodes.multipleCA.valeur)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Multiple utilisé : {valorisation.methodes.multipleCA.multiple.min}x - {valorisation.methodes.multipleCA.multiple.max}x
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Multiple de l&apos;EBITDA</p>
                <p className="text-xl font-bold text-[#1e3a5f]">
                  {formaterEuros(valorisation.methodes.multipleEbitda.valeur)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Multiple utilisé : {valorisation.methodes.multipleEbitda.multiple.min}x - {valorisation.methodes.multipleEbitda.multiple.max}x
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Score global */}
        <div className="card p-6 mb-8">
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
                  stroke={analyse.scoreGlobal >= 70 ? '#10b981' : analyse.scoreGlobal >= 40 ? '#c9a227' : '#ef4444'}
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${analyse.scoreGlobal * 2.51} 251`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-[#1e3a5f]">
                {analyse.scoreGlobal}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-800">
                {analyse.scoreGlobal >= 70
                  ? 'Excellent profil'
                  : analyse.scoreGlobal >= 50
                  ? 'Bon profil'
                  : analyse.scoreGlobal >= 30
                  ? 'Profil moyen'
                  : 'Profil à améliorer'}
              </p>
              <p className="text-sm text-gray-500">
                Ce score reflète l&apos;attractivité globale de l&apos;entreprise pour un acquéreur potentiel.
              </p>
            </div>
          </div>
        </div>

        {/* Comparaison sectorielle */}
        {secteur && analyse.comparaisonSecteur.ecartMarge !== null && (
          <div className="bg-[#1e3a5f]/5 rounded-2xl p-6 border border-[#1e3a5f]/10 mb-8">
            <h3 className="text-lg font-semibold text-[#1e3a5f] mb-4">
              Comparaison sectorielle
            </h3>
            <p className="text-gray-700">
              Secteur : <span className="font-medium">{secteur.nom}</span>
            </p>
            <p className="text-gray-700 mt-2">
              Marge nette moyenne du secteur : <span className="font-medium">{secteur.margeNetteMoyenne}%</span>
            </p>
            <p className={`mt-2 font-medium ${
              analyse.comparaisonSecteur.margeNetteVsSecteur === 'superieure' ? 'text-[#10b981]' :
              analyse.comparaisonSecteur.margeNetteVsSecteur === 'inferieure' ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {analyse.comparaisonSecteur.margeNetteVsSecteur === 'superieure' && (
                <>Rentabilité supérieure au secteur (+{analyse.comparaisonSecteur.ecartMarge}%)</>
              )}
              {analyse.comparaisonSecteur.margeNetteVsSecteur === 'inferieure' && (
                <>Rentabilité inférieure au secteur ({analyse.comparaisonSecteur.ecartMarge}%)</>
              )}
              {analyse.comparaisonSecteur.margeNetteVsSecteur === 'conforme' && (
                <>Rentabilité conforme au secteur</>
              )}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="btn-outline-dark text-center"
          >
            Nouvelle recherche
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
