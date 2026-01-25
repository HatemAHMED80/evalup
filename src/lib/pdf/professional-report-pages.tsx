// Pages supplémentaires du rapport professionnel EvalUp
import React from 'react'
import { Page, Text, View } from '@react-pdf/renderer'
import { COLORS } from './styles'
import { formatCurrency, formatPercent, cleanText, formatVariation, calculateVariation } from './utils'
import { BENCHMARKS, compareWithBenchmark, getSectorFromNaf } from './sector-benchmarks'
import { styles, Header, Footer, KPICard, NoteCircle, BarChart, type ProfessionalReportData } from './professional-report'

// ============================================
// PAGES 5-7: PRÉSENTATION ENTREPRISE
// ============================================

export const CompanyPresentation = ({ data }: { data: ProfessionalReportData }) => (
  <>
    {/* Page 5: Identité */}
    <Page size="A4" style={styles.page}>
      <Header title="Presentation de l'entreprise" />
      <Text style={styles.sectionTitle}>2. Presentation de l'entreprise</Text>
      <Text style={styles.sectionSubtitle}>2.1 Identite et informations legales</Text>

      <View style={styles.row}>
        <View style={styles.col2}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Informations generales</Text>
            <View style={{ marginTop: 8 }}>
              {[
                { label: 'Raison sociale', value: data.entreprise.nom },
                { label: 'SIREN', value: data.entreprise.siren },
                ...(data.entreprise.siret ? [{ label: 'SIRET', value: data.entreprise.siret }] : []),
                ...(data.entreprise.formeJuridique ? [{ label: 'Forme juridique', value: data.entreprise.formeJuridique }] : []),
                { label: 'Date de creation', value: data.entreprise.dateCreation },
                ...(data.entreprise.capital ? [{ label: 'Capital social', value: formatCurrency(data.entreprise.capital) }] : []),
              ].map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 }}>
                  <Text style={{ fontSize: 9, color: COLORS.gray500 }}>{item.label}</Text>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: COLORS.gray900 }}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        <View style={styles.col2}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Coordonnees</Text>
            <View style={{ marginTop: 8 }}>
              {[
                { label: 'Adresse', value: data.entreprise.adresse || data.entreprise.localisation },
                { label: 'Code postal', value: data.entreprise.codePostal || '-' },
                { label: 'Ville', value: data.entreprise.ville || data.entreprise.localisation },
              ].map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 }}>
                  <Text style={{ fontSize: 9, color: COLORS.gray500 }}>{item.label}</Text>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: COLORS.gray900, maxWidth: 150 }}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Activite</Text>
            <View style={{ marginTop: 8 }}>
              {[
                { label: 'Code NAF', value: data.entreprise.codeNaf },
                { label: 'Libelle NAF', value: data.entreprise.libelleNaf || data.entreprise.secteur },
                { label: 'Secteur', value: data.entreprise.secteur },
              ].map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 }}>
                  <Text style={{ fontSize: 9, color: COLORS.gray500 }}>{item.label}</Text>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: COLORS.gray900, maxWidth: 150 }}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.sectionSubtitle}>Effectifs</Text>
      <View style={styles.row}>
        <View style={styles.col3}>
          <KPICard label="Effectif actuel" value={String(data.entreprise.effectif)} />
        </View>
        {data.entreprise.trancheEffectif && (
          <View style={styles.col3}>
            <KPICard label="Tranche d'effectif" value={data.entreprise.trancheEffectif} />
          </View>
        )}
        <View style={styles.col3}>
          <KPICard label="CA par salarie" value={formatCurrency(data.financier.ca / (Number(data.entreprise.effectif) || 1))} />
        </View>
      </View>

      <Footer company={data.entreprise.nom} pageNum={5} totalPages={30} />
    </Page>

    {/* Page 6: Historique */}
    <Page size="A4" style={styles.page}>
      <Header title="Presentation de l'entreprise" />
      <Text style={styles.sectionSubtitle}>2.2 Historique et activite</Text>

      <View style={[styles.card, styles.cardPrimary]}>
        <Text style={styles.cardTitle}>Description de l'activite</Text>
        <Text style={styles.paragraph}>
          {cleanText(data.entreprise.activite || `${data.entreprise.nom} est une entreprise du secteur ${data.entreprise.secteur} creee en ${data.entreprise.dateCreation.split('-')[0] || data.entreprise.dateCreation}. Basee a ${data.entreprise.localisation}, elle emploie ${data.entreprise.effectif} collaborateurs et realise un chiffre d'affaires de ${formatCurrency(data.financier.ca)}.`)}
        </Text>
      </View>

      <Text style={styles.sectionSubtitle}>Evolution historique</Text>
      {data.historique.length > 0 ? (
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Annee</Text>
            <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>Chiffre d'affaires</Text>
            <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>Resultat net</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Effectif</Text>
          </View>
          {data.historique.slice(0, 5).map((h, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCellBold, { flex: 1 }]}>{h.annee}</Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>{formatCurrency(h.ca)}</Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: 'right', color: h.resultatNet >= 0 ? COLORS.success : COLORS.danger }]}>
                {formatCurrency(h.resultatNet)}
              </Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{h.effectif || '-'}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.paragraph}>Historique non disponible.</Text>
      )}

      {/* Graphique évolution CA */}
      {data.historique.length > 0 && (
        <>
          <Text style={styles.sectionSubtitle}>Evolution du chiffre d'affaires</Text>
          <BarChart
            data={data.historique.slice(0, 4).reverse().map(h => ({ label: String(h.annee), value: h.ca, color: COLORS.primary }))}
            maxValue={Math.max(...data.historique.map(h => h.ca)) * 1.1}
          />
        </>
      )}

      <Footer company={data.entreprise.nom} pageNum={6} totalPages={30} />
    </Page>

    {/* Page 7: Gouvernance */}
    <Page size="A4" style={styles.page}>
      <Header title="Presentation de l'entreprise" />
      <Text style={styles.sectionSubtitle}>2.3 Organisation et gouvernance</Text>

      {data.entreprise.dirigeants && data.entreprise.dirigeants.length > 0 ? (
        <>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: COLORS.gray900, marginBottom: 10 }}>Equipe dirigeante</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Nom</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Fonction</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Depuis</Text>
            </View>
            {data.entreprise.dirigeants.map((d, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCellBold, { flex: 2 }]}>{d.nom}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{d.fonction}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{d.dateNomination || '-'}</Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dirigeant principal</Text>
          <Text style={styles.paragraph}>Information non disponible dans les donnees publiques.</Text>
        </View>
      )}

      <Text style={styles.sectionSubtitle}>Structure organisationnelle</Text>
      <View style={styles.row}>
        <View style={styles.col2}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Repartition par fonction</Text>
            <Text style={styles.paragraph}>
              L'entreprise emploie {data.entreprise.effectif} collaborateurs repartis entre les fonctions operationnelles, commerciales et administratives.
            </Text>
          </View>
        </View>
        <View style={styles.col2}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Indicateurs RH</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ fontSize: 9, color: COLORS.gray500 }}>CA / Employe</Text>
              <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{formatCurrency(data.financier.ca / (Number(data.entreprise.effectif) || 1))}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={{ fontSize: 9, color: COLORS.gray500 }}>Resultat / Employe</Text>
              <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{formatCurrency(data.financier.resultatNet / (Number(data.entreprise.effectif) || 1))}</Text>
            </View>
          </View>
        </View>
      </View>

      <Footer company={data.entreprise.nom} pageNum={7} totalPages={30} />
    </Page>
  </>
)

// ============================================
// PAGES 8-10: ANALYSE MARCHÉ
// ============================================

export const MarketAnalysis = ({ data }: { data: ProfessionalReportData }) => {
  const secteurCode = getSectorFromNaf(data.entreprise.codeNaf)
  const benchmark = BENCHMARKS[secteurCode] || BENCHMARKS.default

  return (
    <>
      {/* Page 8: Secteur */}
      <Page size="A4" style={styles.page}>
        <Header title="Analyse du marche" />
        <Text style={styles.sectionTitle}>3. Analyse du marche</Text>
        <Text style={styles.sectionSubtitle}>3.1 Secteur d'activite: {benchmark.nom}</Text>

        <View style={[styles.card, styles.cardPrimary]}>
          <Text style={styles.cardTitle}>Caracteristiques du secteur</Text>
          <Text style={styles.paragraph}>
            Le secteur {benchmark.nom} se caracterise par des marges EBITDA typiques entre {formatPercent(benchmark.margeEbitda.min)} et {formatPercent(benchmark.margeEbitda.max)}, avec une mediane a {formatPercent(benchmark.margeEbitda.median)}. Les multiples de valorisation observes sur les transactions recentes varient de {benchmark.multipleEbitda.min}x a {benchmark.multipleEbitda.max}x l'EBITDA.
          </Text>
        </View>

        <Text style={styles.sectionSubtitle}>Benchmarks sectoriels</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Indicateur</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Min</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Mediane</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Max</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Votre valeur</Text>
          </View>
          {[
            { label: 'Marge nette', bench: benchmark.margeNette, value: data.financier.margeNette, format: formatPercent },
            { label: 'Marge EBITDA', bench: benchmark.margeEbitda, value: data.financier.margeEbitda, format: formatPercent },
            { label: 'DSO (jours)', bench: benchmark.dso, value: data.financier.dso, format: (v: number) => `${Math.round(v)} j` },
          ].map((item, i) => {
            const status = compareWithBenchmark(item.value, item.bench)
            const statusColor = status === 'good' ? COLORS.success : status === 'average' ? COLORS.warning : COLORS.danger
            return (
              <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCellBold, { flex: 2 }]}>{item.label}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{item.format(item.bench.min)}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{item.format(item.bench.median)}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{item.format(item.bench.max)}</Text>
                <Text style={[styles.tableCellBold, { flex: 1, textAlign: 'center', color: statusColor }]}>{item.format(item.value)}</Text>
              </View>
            )
          })}
        </View>

        {data.marche?.tendances && data.marche.tendances.length > 0 && (
          <>
            <Text style={styles.sectionSubtitle}>Tendances du marche</Text>
            <View style={styles.card}>
              {data.marche.tendances.map((t, i) => (
                <View key={i} style={styles.bulletPoint}>
                  <Text style={styles.bullet}>-</Text>
                  <Text style={styles.bulletText}>{cleanText(t)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <Footer company={data.entreprise.nom} pageNum={8} totalPages={30} />
      </Page>

      {/* Page 9-10: Concurrence */}
      <Page size="A4" style={styles.page}>
        <Header title="Analyse du marche" />
        <Text style={styles.sectionSubtitle}>3.2 Positionnement concurrentiel</Text>

        {data.marche?.concurrents && data.marche.concurrents.length > 0 ? (
          <>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: COLORS.gray900, marginBottom: 10 }}>Principaux concurrents identifies</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Concurrent</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Position sur le marche</Text>
              </View>
              {data.marche.concurrents.map((c, i) => (
                <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <Text style={[styles.tableCellBold, { flex: 2 }]}>{c.nom}</Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{c.position || 'Non renseigne'}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Environnement concurrentiel</Text>
            <Text style={styles.paragraph}>
              L'entreprise evolue dans un marche {data.financier.margeEbitda > benchmark.margeEbitda.median ? 'relativement protege avec des marges superieures a la mediane sectorielle' : 'concurrentiel avec une pression sur les marges'}.
            </Text>
          </View>
        )}

        <Text style={styles.sectionSubtitle}>Clientele et fournisseurs</Text>
        <View style={styles.row}>
          <View style={styles.col2}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Typologie client</Text>
              <Text style={styles.paragraph}>{data.marche?.clientele || 'Information non disponible. A completer lors de l\'analyse approfondie.'}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <Text style={{ fontSize: 9, color: COLORS.gray500 }}>Delai client (DSO)</Text>
                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{Math.round(data.financier.dso)} jours</Text>
              </View>
            </View>
          </View>
          <View style={styles.col2}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Fournisseurs</Text>
              <Text style={styles.paragraph}>{data.marche?.fournisseurs || 'Information non disponible.'}</Text>
              {data.financier.dpo && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                  <Text style={{ fontSize: 9, color: COLORS.gray500 }}>Delai fournisseur (DPO)</Text>
                  <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{Math.round(data.financier.dpo)} jours</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <Footer company={data.entreprise.nom} pageNum={9} totalPages={30} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Header title="Analyse du marche" />

        <Text style={styles.sectionSubtitle}>Forces et faiblesses concurrentielles</Text>
        <View style={styles.row}>
          <View style={styles.col2}>
            <View style={[styles.card, styles.cardSuccess]}>
              <Text style={styles.cardTitle}>Avantages competitifs</Text>
              {(data.swot?.forces || data.pointsForts).slice(0, 4).map((f, i) => (
                <View key={i} style={styles.bulletPoint}>
                  <Text style={[styles.bullet, { color: COLORS.success }]}>+</Text>
                  <Text style={styles.bulletText}>{cleanText(f)}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.col2}>
            <View style={[styles.card, styles.cardWarning]}>
              <Text style={styles.cardTitle}>Axes d'amelioration</Text>
              {(data.swot?.faiblesses || data.pointsVigilance).slice(0, 4).map((f, i) => (
                <View key={i} style={styles.bulletPoint}>
                  <Text style={[styles.bullet, { color: COLORS.warning }]}>-</Text>
                  <Text style={styles.bulletText}>{cleanText(f)}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <Footer company={data.entreprise.nom} pageNum={10} totalPages={30} />
      </Page>
    </>
  )
}

// ============================================
// PAGES 11-15: ANALYSE FINANCIÈRE
// ============================================

export const FinancialAnalysis = ({ data }: { data: ProfessionalReportData }) => {
  const hasMultipleYears = data.historique.length >= 2
  const caGrowth = hasMultipleYears ? calculateVariation(data.historique[0].ca, data.historique[1].ca) : 0

  return (
    <>
      {/* Page 11: Evolution CA */}
      <Page size="A4" style={styles.page}>
        <Header title="Analyse financiere" />
        <Text style={styles.sectionTitle}>4. Analyse financiere</Text>
        <Text style={styles.sectionSubtitle}>4.1 Evolution du chiffre d'affaires</Text>

        <View style={styles.row}>
          <View style={styles.col2}>
            <View style={[styles.card, { backgroundColor: COLORS.primary, padding: 20 }]}>
              <Text style={{ fontSize: 10, color: COLORS.white, opacity: 0.9 }}>Chiffre d'affaires</Text>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.white, marginVertical: 5 }}>{formatCurrency(data.financier.ca)}</Text>
              {hasMultipleYears && (
                <Text style={{ fontSize: 11, color: caGrowth >= 0 ? '#86EFAC' : '#FCA5A5' }}>
                  {formatVariation(caGrowth)} vs N-1
                </Text>
              )}
            </View>
          </View>
          <View style={styles.col2}>
            <KPICard label="CA / Employe" value={formatCurrency(data.financier.ca / (Number(data.entreprise.effectif) || 1))} />
            <KPICard label="Croissance moyenne" value={hasMultipleYears ? formatVariation(caGrowth) : 'N/A'} />
          </View>
        </View>

        {data.historique.length > 0 && (
          <>
            <Text style={styles.sectionSubtitle}>Historique du chiffre d'affaires</Text>
            <BarChart
              data={data.historique.slice(0, 5).reverse().map(h => ({
                label: String(h.annee),
                value: h.ca,
                color: COLORS.primary
              }))}
              maxValue={Math.max(...data.historique.map(h => h.ca)) * 1.1}
            />
          </>
        )}

        <Footer company={data.entreprise.nom} pageNum={11} totalPages={30} />
      </Page>

      {/* Page 12: Rentabilité */}
      <Page size="A4" style={styles.page}>
        <Header title="Analyse financiere" />
        <Text style={styles.sectionSubtitle}>4.2 Rentabilite et marges</Text>

        <View style={styles.row}>
          {data.financier.margeBrute !== undefined && (
            <View style={styles.col3}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Marge brute</Text>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.primary }}>{formatPercent(data.financier.margeBrute)}</Text>
              </View>
            </View>
          )}
          <View style={styles.col3}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Marge EBITDA</Text>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.primary }}>{formatPercent(data.financier.margeEbitda)}</Text>
            </View>
          </View>
          <View style={styles.col3}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Marge nette</Text>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: data.financier.margeNette >= 0 ? COLORS.success : COLORS.danger }}>{formatPercent(data.financier.margeNette)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionSubtitle}>Cascade de rentabilite</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Agregat</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Montant</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>% du CA</Text>
          </View>
          {[
            { label: 'Chiffre d\'affaires', value: data.financier.ca, pct: 1 },
            { label: 'EBITDA', value: data.financier.ebitda, pct: data.financier.margeEbitda },
            ...(data.financier.resultatExploitation !== undefined ? [{ label: 'Resultat d\'exploitation', value: data.financier.resultatExploitation, pct: data.financier.resultatExploitation / data.financier.ca }] : []),
            { label: 'Resultat net', value: data.financier.resultatNet, pct: data.financier.margeNette },
          ].map((item, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCellBold, { flex: 2 }]}>{item.label}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(item.value)}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatPercent(item.pct)}</Text>
            </View>
          ))}
        </View>

        {/* Ratios de rentabilité */}
        <Text style={styles.sectionSubtitle}>Ratios de rentabilite</Text>
        <View style={styles.row}>
          <View style={styles.col2}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>ROE (Rentabilite des capitaux propres)</Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: (data.financier.roe || 0) >= 0.1 ? COLORS.success : COLORS.warning }}>
                {formatPercent(data.financier.roe || (data.financier.resultatNet / data.financier.capitauxPropres))}
              </Text>
              <Text style={{ fontSize: 8, color: COLORS.gray500, marginTop: 4 }}>Resultat Net / Capitaux Propres</Text>
            </View>
          </View>
          {data.financier.roce !== undefined && (
            <View style={styles.col2}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>ROCE (Rentabilite des capitaux employes)</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: data.financier.roce >= 0.08 ? COLORS.success : COLORS.warning }}>
                  {formatPercent(data.financier.roce)}
                </Text>
                <Text style={{ fontSize: 8, color: COLORS.gray500, marginTop: 4 }}>Resultat d'exploitation / Capitaux Employes</Text>
              </View>
            </View>
          )}
        </View>

        <Footer company={data.entreprise.nom} pageNum={12} totalPages={30} />
      </Page>

      {/* Page 13: Bilan */}
      <Page size="A4" style={styles.page}>
        <Header title="Analyse financiere" />
        <Text style={styles.sectionSubtitle}>4.3 Structure du bilan</Text>

        <View style={styles.row}>
          <View style={styles.col2}>
            <View style={[styles.card, styles.cardPrimary]}>
              <Text style={styles.cardTitle}>Actif</Text>
              <View style={{ marginTop: 8 }}>
                {[
                  { label: 'Stocks', value: data.financier.stocks || 0 },
                  { label: 'Creances clients', value: data.financier.creancesClients || 0 },
                  { label: 'Tresorerie', value: data.financier.tresorerie },
                ].map((item, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                    <Text style={{ fontSize: 9, color: COLORS.gray700 }}>{item.label}</Text>
                    <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{formatCurrency(item.value)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
          <View style={styles.col2}>
            <View style={[styles.card, styles.cardWarning]}>
              <Text style={styles.cardTitle}>Passif</Text>
              <View style={{ marginTop: 8 }}>
                {[
                  { label: 'Capitaux propres', value: data.financier.capitauxPropres },
                  { label: 'Dettes financieres', value: data.financier.dettes },
                  { label: 'Dettes fournisseurs', value: data.financier.dettesFournisseurs || 0 },
                ].map((item, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                    <Text style={{ fontSize: 9, color: COLORS.gray700 }}>{item.label}</Text>
                    <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{formatCurrency(item.value)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionSubtitle}>Ratios de structure</Text>
        <View style={styles.row}>
          <View style={styles.col3}>
            <KPICard label="Ratio d'endettement" value={formatPercent(data.financier.ratioEndettement)} />
          </View>
          <View style={styles.col3}>
            <KPICard label="Gearing" value={`${(data.financier.dettes / data.financier.capitauxPropres * 100).toFixed(0)}%`} />
          </View>
          <View style={styles.col3}>
            <KPICard label="Ratio couverture" value={data.financier.ratioCouverture ? `${data.financier.ratioCouverture.toFixed(1)}x` : 'N/A'} />
          </View>
        </View>

        <Footer company={data.entreprise.nom} pageNum={13} totalPages={30} />
      </Page>

      {/* Page 14: BFR */}
      <Page size="A4" style={styles.page}>
        <Header title="Analyse financiere" />
        <Text style={styles.sectionSubtitle}>4.4 BFR et tresorerie</Text>

        <View style={[styles.card, { backgroundColor: COLORS.primary, padding: 20, alignItems: 'center' }]}>
          <Text style={{ fontSize: 10, color: COLORS.white, opacity: 0.9 }}>Besoin en Fonds de Roulement (BFR)</Text>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: COLORS.white, marginVertical: 5 }}>
            {formatCurrency(data.financier.bfr || ((data.financier.stocks || 0) + (data.financier.creancesClients || 0) - (data.financier.dettesFournisseurs || 0)))}
          </Text>
          <Text style={{ fontSize: 11, color: COLORS.white, opacity: 0.8 }}>
            Soit {data.financier.bfrJours || Math.round(((data.financier.bfr || 0) / data.financier.ca) * 365)} jours de CA
          </Text>
        </View>

        <Text style={styles.sectionSubtitle}>Decomposition du BFR</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Composante</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Montant</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Jours de CA</Text>
          </View>
          {[
            { label: '+ Stocks', value: data.financier.stocks || 0 },
            { label: '+ Creances clients', value: data.financier.creancesClients || 0 },
            { label: '- Dettes fournisseurs', value: -(data.financier.dettesFournisseurs || 0) },
          ].map((item, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCellBold, { flex: 2 }]}>{item.label}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', color: item.value < 0 ? COLORS.success : COLORS.gray700 }]}>
                {formatCurrency(item.value)}
              </Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                {Math.round((Math.abs(item.value) / data.financier.ca) * 365)} j
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionSubtitle}>Analyse de la tresorerie</Text>
        <View style={styles.row}>
          <View style={styles.col2}>
            <KPICard
              label="Tresorerie disponible"
              value={formatCurrency(data.financier.tresorerie)}
              positive={data.financier.tresorerie > 0}
            />
          </View>
          <View style={styles.col2}>
            <KPICard
              label="Tresorerie nette"
              value={formatCurrency(data.financier.tresorerie - data.financier.dettes)}
              positive={(data.financier.tresorerie - data.financier.dettes) > 0}
            />
          </View>
        </View>

        <Footer company={data.entreprise.nom} pageNum={14} totalPages={30} />
      </Page>

      {/* Page 15: FCF */}
      <Page size="A4" style={styles.page}>
        <Header title="Analyse financiere" />
        <Text style={styles.sectionSubtitle}>4.5 Flux de tresorerie (estimation)</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Free Cash Flow estime</Text>
          <Text style={styles.paragraph}>
            Le Free Cash Flow (FCF) represente la tresorerie disponible apres financement des investissements.
            Il constitue un indicateur cle de la capacite de l'entreprise a generer des liquidites.
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Element</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Montant</Text>
          </View>
          {[
            { label: 'EBITDA', value: data.financier.ebitda },
            { label: '- Impots (estimation 25%)', value: -data.financier.ebitda * 0.25 },
            { label: '- Variation BFR (estimation)', value: -(data.financier.bfr || 0) * 0.05 },
            { label: '- CAPEX (estimation 3% CA)', value: -data.financier.ca * 0.03 },
            { label: '= Free Cash Flow', value: data.financier.ebitda * 0.75 - (data.financier.bfr || 0) * 0.05 - data.financier.ca * 0.03, isBold: true },
          ].map((item, i) => (
            <View key={i} style={[styles.tableRow, i === 4 ? { backgroundColor: COLORS.bgLight } : i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[item.isBold ? styles.tableCellBold : styles.tableCell, { flex: 2 }]}>{item.label}</Text>
              <Text style={[item.isBold ? styles.tableCellBold : styles.tableCell, { flex: 1, textAlign: 'right', color: item.value < 0 ? COLORS.danger : COLORS.gray700 }]}>
                {formatCurrency(item.value)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>Note methodologique</Text>
          <Text style={styles.disclaimerText}>
            Ces estimations de flux sont basees sur des hypotheses standards et doivent etre ajustees
            en fonction des specificites de l'entreprise (politique d'investissement, saisonnalite du BFR, etc.).
          </Text>
        </View>

        <Footer company={data.entreprise.nom} pageNum={15} totalPages={30} />
      </Page>
    </>
  )
}
