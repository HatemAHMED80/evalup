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

---

## A faire

### 1. Archetype commerce_gros (DISTRIPHARMA)

**Source :** audit commerce_gros — NAF 46.46Z route vers commerce_retail au lieu de commerce_gros

- [ ] `data/multiples.json` — ajouter entree `commerce_gros` (EBITDA 3-3.5-4x, CA 0.2-0.4-0.6x)
- [ ] `src/lib/valuation/archetypes.ts` — ajouter definition archetype commerce_gros (name, icon, methods, etc.)
- [ ] `src/lib/valuation/archetypes.ts` detectArchetype — routing NAF 46.xx via `nafCode` param (deja dans DiagnosticInput, jamais utilise)
- [ ] `src/lib/valuation/calculator-v2.ts` — WEIGHTS commerce_gros [75,25] + getPrimaryMetric + getSecondaryMetric
- [ ] `tests/generate-reports.ts` — ARCHETYPE_MAP commerce_gros: 'commerce_gros' (au lieu de 'commerce_retail')

### 2. Gate confiance concentration > 50% (DISTRIPHARMA + ROCKETFLOW)

**Source :** concentration client > 50% du CA = incertitude majeure sur perennite

- [ ] `src/lib/pdf/assemble-report-data.ts` — assembleReportData path : si `concentrationClients > 50` → cap confiance a Moyenne
- [ ] `src/lib/pdf/assemble-report-data.ts` — assembleFromEvaluationData path : idem

### 3. Forces enrichment (DISTRIPHARMA + ROCKETFLOW)

**Source :** forces SWOT trop generiques, ne refletent pas les metriques cles du profil

- [ ] `src/lib/pdf/assemble-report-data.ts` DiagnosticContext — ajouter champ `recurring?: number`
- [ ] `src/lib/pdf/assemble-report-data.ts` genererPointsForts — "Croissance forte" quand growth > 20%
- [ ] `src/lib/pdf/assemble-report-data.ts` genererPointsForts — "Recurrence elevee" quand recurring > 60%
- [ ] `src/lib/pdf/assemble-report-data.ts` genererPointsForts — "CA significatif" quand revenue > 5M
- [ ] Passer `recurring` dans diagCtx des deux paths d'assemblage

### 4. Gate "Tresorerie solide" quand EBITDA < 0 (ROCKETFLOW)

**Source :** pour pre_revenue/startup, la tresorerie est du runway, pas une force

- [ ] `src/lib/pdf/assemble-report-data.ts` genererPointsForts — ne pas afficher "Tresorerie solide" quand `diagCtx.ebitda < 0`

### 5. Matrice de sensibilite ARR pour SaaS (ROCKETFLOW)

**Source :** matrice calcule EBITDA x multiple pour TOUS les profils, meme SaaS ou la VE est basee sur ARR

- [ ] `src/lib/pdf/professional-report.tsx` ProfessionalReportData — ajouter champ optionnel `sensitivityBase?: { value: number; label: string }`
- [ ] `src/lib/pdf/assemble-report-data.ts` — populer sensitivityBase avec ARR pour saas_hyper/saas_mature, EBITDA pour les autres
- [ ] `src/lib/pdf/professional-report-final.tsx` — utiliser `data.sensitivityBase` au lieu de `data.ebitdaNormalise.ebitdaNormalise` comme base de la matrice

### 6. Donnees de test a aligner (ROCKETFLOW)

**Source :** pappers.ca = 400k mais diagnostic.revenue = 800k — desalignement en amont

- [ ] `tests/fixtures/scenarios.ts` — verifier coherence pappers.ca vs diagnostic.revenue pour saas_hyper
