# TODO — Corrections audit rapports PDF

## Deja fait (sessions precedentes)

- [x] `calculator-v2.ts` — micro_solo VE cap quand remu=0 + CA<100k
- [x] `diagnostic.ts` — plancher 35 (D min) quand remu=0 + CA<100k
- [x] `assemble-report-data.ts` — filtrer marge/rentabilite des forces quand remu=0
- [x] `assemble-report-data.ts` — injecter vigilances obligatoires (remu=0, micro, transf., masse sal., burn rate)
- [x] `calculator-v2.ts` — pre_revenue bridge : calculer netDebt + equityValue
- [x] `diagnostic.ts` — plancher 35 startup (EBITDA<0 + treso>100k + growth>0)
- [x] `generate-qualitative.ts` — ne pas afficher "Endettement maitrise" quand EBITDA<0
- [x] `calculator-v2.ts` — patrimoine bridge debt-only (pas de cash offset)
- [x] `assemble-report-data.ts` + `evaluation-adapter.ts` — populer `assets` pour patrimoine
- [x] `calculator-v2.ts` — masse_salariale_lourde weights [70,30] -> [90,10]
- [x] `assemble-report-data.ts` — vigilance masse salariale > 60%
- [x] `calculator-v2.ts` — patrimoine weights [100,0] -> [20,80] (capitalisation loyers)
- [x] `assemble-report-data.ts` — gate confiance patrimoine -> Moyenne (actifs non reevalues)
- [x] `data/multiples.json` — corrige industrie EBITDA 5.5->5, ecommerce CA 2->0.6, conseil high 7->6, services_recurrents high 10->8 + secondary
- [x] `assemble-report-data.ts` — endettement 2 tiers (>0.7 significatif, >1.5 eleve)
- [x] `assemble-report-data.ts` — recurring force >= 60, growth force >= 20, anciennete > 10 ans, CA > 5M
- [x] `assemble-report-data.ts` — gate DSO force derriere revenue >= 100k
- [x] `assemble-report-data.ts` — gate tresorerie solide quand EBITDA < 0
- [x] `assemble-report-data.ts` — gate isPreRevenue sur toutes vigilances ratio-based
- [x] `assemble-report-data.ts` — vigilances SaaS (churn, NRR, runway) + pre-revenu explicite
- [x] `assemble-report-data.ts` — fallback tresorerieActuelle/dettesFinancieres sur bilan
- [x] `assemble-report-data.ts` — gate confiance concentration > 50% (Gate 7, 2 paths)
- [x] `assemble-report-data.ts` — sensitivityBase ARR pour SaaS dans matrice sensibilite
- [x] `diagnostic.ts` — bonus croissance 20-40%, plancher SaaS mature A (80)
- [x] `calculator-v2.ts` — saas_mature weights [40,60]
- [x] `sector-benchmarks.ts` — secteur ecommerce + NAF routing
- [x] `generate-qualitative.ts` — ecommerce dans DONNEES_SECTEUR + BENCHMARKS_NOMS
- [x] `tests/generate-reports.ts` — runway saasMetrics + nafCode diagInput

---

## Deja fait (session actuelle)

- [x] `data/multiples.json` — ajout commerce_gros (EBITDA 3-3.5-4x, CA 0.2-0.4-0.6x)
- [x] `archetypes.ts` — definition commerce_gros + routing NAF 46.xx dans detectArchetype
- [x] `calculator-v2.ts` — WEIGHTS commerce_gros [75,25] + getPrimaryMetric + getSecondaryMetric + getMethodLabel + calculateConfidence
- [x] `sector-benchmarks.ts` — benchmark commerce_gros + NAF 46 -> commerce_gros
- [x] `generate-qualitative.ts` — commerce_gros dans DONNEES_SECTEUR + BENCHMARKS_NOMS
- [x] `generate-reports.ts` — ARCHETYPE_MAP commerce_gros: 'commerce_gros' + nafCode

## Verifie (pas de changement necessaire)

- [x] ROCKETFLOW pappers.ca=400k vs diagnostic.revenue=800k : coherent (SaaS hyper 95%, 400k->800k en 1 an)

---

## A faire

*(Tous les items de l'audit sont traites)*
