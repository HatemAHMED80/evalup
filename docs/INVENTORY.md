# Inventaire complet — Fichiers Valorisation & Prompts

> Audit du 10 février 2026 — 77 fichiers, ~18 500 lignes

---

## Table des matières

1. [Prompts (`src/lib/prompts/`)](#1-prompts)
2. [Moteur d'évaluation (`src/lib/evaluation/`)](#2-moteur-dévaluation)
3. [Génération PDF (`src/lib/pdf/`)](#3-génération-pdf)
4. [Client IA & Types (`src/lib/anthropic.ts`)](#4-client-ia--types)
5. [API Pappers (`src/lib/pappers.ts`)](#5-api-pappers)
6. [Optimisation IA (`src/lib/ai/`)](#6-optimisation-ia)
7. [Analyse financière (`src/lib/analyse/`)](#7-analyse-financière)
8. [Gestion usage & quotas (`src/lib/usage/`)](#8-gestion-usage--quotas)
9. [Stripe & paiements (`src/lib/stripe/`)](#9-stripe--paiements)
10. [Sécurité (`src/lib/security/`)](#10-sécurité)
11. [Supabase (`src/lib/supabase/`)](#11-supabase)
12. [Autres libs (`src/lib/`)](#12-autres-libs)
13. [Routes API (`src/app/api/`)](#13-routes-api)
14. [Composants Chat (`src/components/chat/`)](#14-composants-chat)
15. [Composants UI (`src/components/ui/`)](#15-composants-ui)
16. [Statistiques globales](#16-statistiques-globales)
17. [Graphe de dépendances](#17-graphe-de-dépendances)

---

## 1. Prompts

**Répertoire :** `src/lib/prompts/`
**Total :** 9 fichiers, ~2 069 lignes

| # | Fichier | Lignes | Rôle | Exports principaux |
|---|---------|--------|------|--------------------|
| 1 | `base.ts` | 809 | Prompt système principal avec méthodologie, règles, benchmarks | `BASE_SYSTEM_PROMPT`, `EVALUATION_FINALE_PROMPT`, `MESSAGE_INITIAL`, `MESSAGE_INITIAL_SANS_DOCUMENTS` |
| 2 | `index.ts` | 330 | Orchestrateur : sélectionne le prompt selon type/parcours/pédagogie/secteur | `getSystemPrompt()`, `detecterSecteur()`, `getNomSecteur()`, types `EvaluationType`, `UserParcours`, `PedagogyLevel` |
| 3 | `flash.ts` | 143 | Prompt simplifié pour évaluation Flash (8 questions) | `FLASH_SYSTEM_PROMPT`, `FLASH_QUESTIONS_LIMIT` |
| 4 | `parcours.ts` | 264 | Personnalisation par profil utilisateur et niveau pédagogique | `PEDAGOGY_PROMPTS`, `PARCOURS_OPTIONS`, `SYSTEM_PROMPTS`, `INTRO_MESSAGES`, `PEDAGOGY_OPTIONS` |
| 5 | `secteurs/commerce.ts` | 84 | Prompt spécialiste commerce/retail | `COMMERCE_PROMPT`, `COMMERCE_ANOMALIES_CONDITIONS` |
| 6 | `secteurs/restaurant.ts` | 136 | Prompt spécialiste restauration | `RESTAURANT_PROMPT`, `RESTAURANT_ANOMALIES_CONDITIONS` |
| 7 | `secteurs/saas.ts` | 101 | Prompt spécialiste SaaS/Tech (MRR, ARR, churn) | `SAAS_PROMPT`, `SAAS_ANOMALIES_CONDITIONS` |
| 8 | `secteurs/services.ts` | 104 | Prompt spécialiste services B2B | `SERVICES_PROMPT`, `SERVICES_ANOMALIES_CONDITIONS` |
| 9 | `secteurs/transport.ts` | 98 | Prompt spécialiste transport/logistique | `TRANSPORT_PROMPT`, `TRANSPORT_ANOMALIES_CONDITIONS` |

**Consommateurs :**
- `base.ts` → `prompts/index.ts`, `api/chat/route.ts`, `ChatInterface.tsx`
- `index.ts` → `api/chat/route.ts`, `ChatInterface.tsx`
- `flash.ts` → `prompts/index.ts`
- `parcours.ts` → `prompts/index.ts`
- `secteurs/*.ts` → `prompts/index.ts`

---

## 2. Moteur d'évaluation

**Répertoire :** `src/lib/evaluation/`
**Total :** 17 fichiers, ~4 489 lignes

### Fichiers principaux

| # | Fichier | Lignes | Rôle | Exports principaux |
|---|---------|--------|------|--------------------|
| 10 | `types.ts` | 414 | Définitions de types V1 + V2 | `ConfigSecteur`, `BilanAnnuel`, `RetraitementEbitda`, `EbitdaNormalise`, `DetteFinanciereNette`, `ResultatMethode`, `FourchetteValorisation`, `BridgeValorisation`, `ResultatEvaluationV2`, `DonneesEvaluationV2` |
| 11 | `calculateur-v2.ts` | 773 | Calculateur V2 : EBITDA normalisé → VE → Prix (méthode actuelle) | `evaluerEntrepriseV2()` |
| 12 | `calculateur.ts` | 903 | Calculateur V1 legacy (EBITDA, CA, ANC, Goodwill) | `evaluerEntreprise()`, `evaluerRapide()`, `getQuestionsParSecteur()`, `getFacteursParSecteur()` |
| 13 | `ebitda-normalise.ts` | 415 | Normalisation EBITDA avec retraitements | `calculerEbitdaNormalise()`, `calculerEbitdaComptable()`, `getSalaireNormatifDirigeant()`, `calculerRetraitement*()` (7 fonctions) |
| 14 | `dette-nette.ts` | 262 | Calcul dette financière nette | `calculerDetteNette()`, `genererExplicationDetteNette()` |
| 15 | `index.ts` | 82 | Hub central d'export | Ré-exporte tout : types, calculateurs, EBITDA, dette, secteurs |

### Configurations sectorielles (`evaluation/secteurs/`)

| # | Fichier | Lignes | Secteur(s) | Export |
|---|---------|--------|------------|--------|
| 16 | `index.ts` | 88 | Routeur sectoriel | `SECTEURS[]`, `detecterSecteurEvaluation()`, `getSecteurParCode()`, `getTousLesSecteurs()` |
| 17 | `transport.ts` | 167 | Transport/logistique | `TRANSPORT` |
| 18 | `saas.ts` | 186 | SaaS/Tech | `SAAS` |
| 19 | `restaurant.ts` | 173 | Restauration | `RESTAURANT` |
| 20 | `commerce.ts` | 167 | Commerce/retail | `COMMERCE` |
| 21 | `ecommerce.ts` | 147 | E-commerce | `ECOMMERCE` |
| 22 | `services.ts` | 160 | Services B2B | `SERVICES` |
| 23 | `industrie.ts` | 188 | Industrie | `INDUSTRIE` |
| 24 | `btp.ts` | 172 | BTP/Construction | `BTP` |
| 25 | `sante.ts` | 568 | Santé (6 sous-secteurs) | `SANTE`, `PHARMACIE`, `LABO`, `MEDECIN`, `DENTAIRE`, `PARAMEDICAL` |
| 26 | `default.ts` | 120 | Fallback générique | `DEFAULT` |

**Consommateurs :**
- `evaluation/index.ts` → `api/chat/route.ts`, `api/evaluation/pdf/route.ts`, `pdf/assemble-report-data.ts`, `tests/backtest-calculateur.ts`
- `calculateur-v2.ts` → `pdf/assemble-report-data.ts`, `api/evaluation/pdf/route.ts`, `api/entreprise/[siren]/quick-valuation/route.ts`
- `secteurs/index.ts` → `prompts/index.ts`, `calculateur-v2.ts`

---

## 3. Génération PDF

**Répertoire :** `src/lib/pdf/`
**Total :** 11 fichiers, ~5 288 lignes

| # | Fichier | Lignes | Rôle | Exports principaux |
|---|---------|--------|------|--------------------|
| 27 | `index.ts` | 20 | Hub d'export PDF | Ré-exporte generator, professional-report-final, utils, styles, sector-benchmarks |
| 28 | `generator.tsx` | 1 182 | PDF standard 3 pages | `generateEvaluationPDF()`, `generateEvaluationPDFBuffer()`, `EvaluationData` |
| 29 | `professional-report-final.tsx` | 925 | PDF pro 25-40 pages | `generateProfessionalPDF()`, `generateProfessionalPDFBuffer()`, `ProfessionalReport` |
| 30 | `professional-report-pages.tsx` | 815 | Pages modulaires du rapport pro | `CompanyPresentation`, `MarketAnalysis`, `FinancialAnalysis`, `RatioDashboard` |
| 31 | `professional-report.tsx` | 599 | Composants et structure du rapport pro | `ProfessionalReportData`, `Header`, `Footer`, `KPICard`, `CoverPage`, `TableOfContents`, `ExecutiveSummary` |
| 32 | `EvaluationReport.tsx` | 795 | Composants React PDF pour rapport d'évaluation | Factory components |
| 33 | `assemble-report-data.ts` | 228 | Transformation ConversationContext → ProfessionalReportData | `assembleReportData()` |
| 34 | `generate-qualitative.ts` | 378 | Analyse qualitative (SWOT, marché, risques) | `genererSWOT()`, `genererAnalyseMarche()`, `genererRisques()`, `DONNEES_SECTEUR` |
| 35 | `sector-benchmarks.ts` | 155 | Benchmarks sectoriels pour comparaison | `BENCHMARKS`, `compareWithBenchmark()`, `getSectorFromNaf()`, `getBenchmarkForNaf()` |
| 36 | `utils.ts` | 96 | Formatage (nombres, devises, %) | `formatCurrency()`, `formatPercent()`, `formatNumber()`, `cleanText()`, `calculateVariation()` |
| 37 | `styles.ts` | 90 | Design system PDF (couleurs, typo, espacement) | `COLORS`, `FONTS`, `SPACING`, `BORDERS`, `getStatusColor()` |

**Consommateurs :**
- `pdf/index.ts` → `api/evaluation/pdf/route.ts`, `DownloadReport.tsx`
- `professional-report-final.tsx` ← `professional-report.tsx`, `professional-report-pages.tsx`, `styles.ts`, `utils.ts`, `sector-benchmarks.ts`
- `assemble-report-data.ts` ← `anthropic.ts`, `evaluation/types.ts`, `generate-qualitative.ts`, `sector-benchmarks.ts`, `calculateur-v2.ts`

---

## 4. Client IA & Types

| # | Fichier | Lignes | Rôle | Exports principaux |
|---|---------|--------|------|--------------------|
| 38 | `src/lib/anthropic.ts` | 186 | Client Anthropic SDK + types conversation | `anthropic` (instance), `ConversationContext`, `Message`, `UploadedDocument`, `DocumentAnalysis`, `Anomalie`, `BilanAnnuel`, `RatiosFinanciers`, `isAnthropicConfigured()`, `createMessageWithFallback()`, `createStreamWithFallback()` |

**Consommateurs (11 fichiers) :** `api/chat/route.ts`, `api/documents/analyze/route.ts`, `pdf/assemble-report-data.ts`, `ChatInterface.tsx`, `DownloadReport.tsx`, et 6 autres

---

## 5. API Pappers

| # | Fichier | Lignes | Rôle | Exports principaux |
|---|---------|--------|------|--------------------|
| 39 | `src/lib/pappers.ts` | 632 | Client API Pappers (données entreprises, bilans) | `fetchEntreprisePappers()`, `transformBilans()`, `extractRecentFinancials()`, `extractSirenFromText()`, `isSirenValid()`, `formatSiren()`, types `BilanPappers`, `EntreprisePappers`, `DirigeantPappers`, `FinancesPappers` |

**Consommateurs :** `api/entreprise/[siren]/route.ts`, `api/chat/route.ts`, `api/pappers/route.ts`

---

## 6. Optimisation IA

**Répertoire :** `src/lib/ai/`
**Total :** 9 fichiers, ~3 543 lignes

| # | Fichier | Lignes | Rôle | Exports principaux |
|---|---------|--------|------|--------------------|
| 40 | `index.ts` | 124 | Hub d'export (40+ fonctions, 20+ types) | Ré-exporte tous les sous-modules |
| 41 | `router.ts` | 483 | Routage intelligent Haiku vs Sonnet selon complexité | `routeToModel()`, `analyzePromptSemantics()`, `classifyTask()`, `detectMessageType()`, `createRoutingContext()` |
| 42 | `session-store.ts` | 677 | Stockage session avec Redis fallback | `createSession()`, `getSession()`, `findSessionBySiren()`, `updateSession()`, `addConversationEntry()`, `getConversationContext()`, `deleteSession()` |
| 43 | `cache.ts` | 509 | Cache intelligent avec invalidation par SIREN et LRU | `getFromCache()`, `addToCache()`, `invalidateBySiren()`, `checkCache()`, `saveToCache()`, `getCacheStats()` |
| 44 | `context-optimizer.ts` | 385 | Compression historique et optimisation tokens | `compresserHistorique()`, `extraireDonneesStructurees()`, `optimiserContexte()`, `estimerTokens()`, `necessiteCompression()` |
| 45 | `usage-tracker.ts` | 323 | Suivi coûts API et taux de cache | `trackUsage()`, `getUsageStats()`, `getEvaluationCost()`, `estimerCoutEvaluation()`, `genererRapportUtilisation()` |
| 46 | `anomalies.ts` | 462 | Détection anomalies financières gratuite (règles locales) | `detecterAnomalies()`, `formaterAnomaliesMarkdown()`, `aDesAnomaliesCritiques()`, `calculerScoreComplexite()` |
| 47 | `ratios.ts` | 337 | Calcul ratios financiers gratuit (local) | `calculerRatios()`, `interpreterRatio()`, `genererResumeRatios()`, `calculerMultiplesSuggeres()`, `BENCHMARKS_SECTEUR` |
| 48 | `models.ts` | 243 | Configuration modèles et estimation coûts | `MODELS`, `DEFAULT_MODEL`, `FAST_MODEL`, `SMART_MODEL`, `estimerCout()`, `getModelFallbacks()` |

**Consommateurs :** `api/chat/route.ts` (principal), `api/entreprise/[siren]/route.ts`

---

## 7. Analyse financière

**Répertoire :** `src/lib/analyse/`
**Total :** 4 fichiers, ~860 lignes

| # | Fichier | Lignes | Rôle | Exports principaux |
|---|---------|--------|------|--------------------|
| 49 | `index.ts` | 32 | Hub d'export | Ré-exporte ratios.ts et diagnostic.ts |
| 50 | `anomalies.ts` | 252 | Détection anomalies comptables | `detecterAnomalies()`, `convertirBilansNormalises()` |
| 51 | `ratios.ts` | 283 | Calcul et benchmarking ratios financiers | `calculerRatios()`, `evaluerRatio()`, `formaterRatio()`, `SEUILS_RATIOS`, `SEUILS_PAR_SECTEUR`, `LABELS_RATIOS` |
| 52 | `diagnostic.ts` | 293 | Diagnostic financier structuré | `genererDiagnostic()`, `genererExplicationDiagnostic()`, `comparerRatios()` |

**Consommateurs :** `api/entreprise/[siren]/route.ts`, `api/chat/route.ts`

---

## 8. Gestion usage & quotas

**Répertoire :** `src/lib/usage/`
**Total :** 3 fichiers, ~682 lignes

| # | Fichier | Lignes | Rôle | Exports principaux |
|---|---------|--------|------|--------------------|
| 53 | `index.ts` | 26 | Hub d'export | Ré-exporte tokens.ts et evaluations.ts |
| 54 | `tokens.ts` | 126 | Gestion quotas tokens par utilisateur | `checkTokenUsage()`, `recordTokenUsage()`, `canDownloadPDF()` |
| 55 | `evaluations.ts` | 530 | Workflow évaluation Flash → Complète → Pro | `getOrCreateEvaluation()`, `checkEvaluationAccess()`, `incrementQuestionCount()`, `completeFlashEvaluation()`, `markEvaluationAsPaid()`, `createPurchase()`, `confirmPurchase()` |

**Consommateurs :** `api/chat/route.ts`, `api/evaluation/pdf/route.ts`, `api/stripe/webhooks/route.ts`, `api/stripe/checkout/route.ts`

---

## 9. Stripe & paiements

**Répertoire :** `src/lib/stripe/`
**Total :** 3 fichiers, ~274 lignes

| # | Fichier | Lignes | Rôle | Exports principaux |
|---|---------|--------|------|--------------------|
| 56 | `client.ts` | 27 | Client Stripe serveur | `stripe`, `getStripeClient()` |
| 57 | `browser.ts` | 12 | Client Stripe.js navigateur | `getStripe()` |
| 58 | `plans.ts` | 235 | Définition plans et permissions | `PLANS`, `PlanId`, `getPlan()`, `isPro()`, `canDoCompleteEval()`, `canUploadDocuments()`, `canDownloadPDF()`, `getQuestionsLimit()` |

**Consommateurs :** `api/stripe/checkout/route.ts`, `api/stripe/webhooks/route.ts`, `api/stripe/portal/route.ts`, composants paiement

---

## 10. Sécurité

**Répertoire :** `src/lib/security/`
**Total :** 5 fichiers, ~566 lignes

| # | Fichier | Lignes | Rôle | Exports principaux |
|---|---------|--------|------|--------------------|
| 59 | `index.ts` | 8 | Hub d'export | Ré-exporte auth, rate-limit, validation |
| 60 | `auth.ts` | 96 | Middleware authentification/autorisation | `requireAuth()`, `optionalAuth()`, `requireAdmin()` |
| 61 | `rate-limit.ts` | 202 | Rate limiting (Redis Upstash + mémoire fallback) | `checkRateLimit()`, `getClientIp()`, `getRateLimitHeaders()`, `RATE_LIMITS` |
| 62 | `validation.ts` | 184 | Validation fichiers uploadés et SIREN (Luhn) | `validateUploadedFile()`, `validateFileMagicBytes()`, `sanitizeFilename()`, `isValidSiren()`, `validateAndCleanSiren()` |
| 63 | `schemas.ts` | 76 | Schémas Zod pour validation API | `chatBodySchema`, `checkoutBodySchema`, `pdfBodySchema` |

**Consommateurs :** Toutes les routes API

---

## 11. Supabase

**Répertoire :** `src/lib/supabase/`
**Total :** 3 fichiers, ~139 lignes

| # | Fichier | Lignes | Rôle | Exports principaux |
|---|---------|--------|------|--------------------|
| 64 | `server.ts` | 51 | Client Supabase SSR (Server Components, Route Handlers) | `createClient()`, `createServiceClient()` |
| 65 | `client.ts` | 20 | Client Supabase navigateur (singleton) | `createClient()` |
| 66 | `middleware.ts` | 68 | Protection routes et refresh session | `updateSession()` |

**Consommateurs :** 13+ fichiers (toutes routes API, composants auth)

---

## 12. Autres libs

| # | Fichier | Lignes | Rôle | Exports principaux |
|---|---------|--------|------|--------------------|
| 67 | `src/lib/database.types.ts` | 469 | Types TypeScript du schéma Supabase | `Database` (interface complète : vendeurs, acheteurs, evaluations, subscriptions, invoices, purchases) |
| 68 | `src/lib/analytics.ts` | 100 | Tracking GA4, Plausible, GTM | `trackConversion()`, `trackPurchase()` |
| 69 | `src/lib/evaluation-draft.ts` | 160 | Gestion brouillons localStorage | `saveDraft()`, `getDraftBySiren()`, `deleteDraft()`, `markDraftCompleted()`, `getPendingDrafts()` |
| 70 | `src/lib/emails/send.ts` | 249 | Emails transactionnels via Resend | `sendPaymentConfirmation()`, `sendPaymentFailed()`, `sendSubscriptionWelcome()`, `sendRefundConfirmation()` |

---

## 13. Routes API

**Répertoire :** `src/app/api/`
**Total :** 8 fichiers, ~1 980 lignes

| # | Fichier | Lignes | Rôle | Méthode |
|---|---------|--------|------|---------|
| 71 | `chat/route.ts` | 728 | Chat streaming avec Claude (prompt caching, routing, sessions) | POST |
| 72 | `entreprise/[siren]/route.ts` | 160 | Données entreprise par SIREN avec anomalies | GET |
| 73 | `entreprise/[siren]/quick-valuation/route.ts` | 241 | Valorisation Flash instantanée | GET |
| 74 | `evaluation/pdf/route.ts` | 97 | Génération PDF professionnel 32 pages | POST |
| 75 | `contact/route.ts` | 134 | Formulaire de contact (Resend) | POST |
| 76 | `stripe/checkout/route.ts` | 234 | Création session Stripe Checkout | POST |
| 77 | `stripe/webhooks/route.ts` | 341 | Webhooks Stripe (paiements, abonnements, remboursements) | POST |
| 78 | `stripe/portal/route.ts` | 45 | Portail facturation Stripe | POST |

---

## 14. Composants Chat

**Répertoire :** `src/components/chat/`
**Total :** 14 fichiers, ~2 975 lignes

| # | Fichier | Lignes | Rôle |
|---|---------|--------|------|
| 79 | `ChatInterface.tsx` | 1 062 | Composant principal : conversation, objectifs, pédagogie, documents |
| 80 | `ChatLayout.tsx` | 187 | Layout avec sidebar et zone principale |
| 81 | `FlashValuationDisplay.tsx` | 391 | Affichage résultat Flash avec graphiques et CTA upgrade |
| 82 | `Sidebar.tsx` | 323 | Navigation latérale avec historique |
| 83 | `MessageBubble.tsx` | 292 | Bulle message avec markdown, suggestions, parsing Flash |
| 84 | `DownloadReport.tsx` | 220 | Téléchargement/partage PDF (premium) |
| 85 | `ChatInput.tsx` | 167 | Champ de saisie avec limite caractères |
| 86 | `MessageAI.tsx` | 77 | Affichage message IA |
| 87 | `QuickReplies.tsx` | 76 | Boutons suggestions rapides |
| 88 | `ChatArea.tsx` | 69 | Container messages avec scroll |
| 89 | `DocumentUpload.tsx` | 52 | Upload documents financiers |
| 90 | `MessageUser.tsx` | 25 | Affichage message utilisateur |
| 91 | `TypingIndicator.tsx` | 20 | Indicateur "en train d'écrire" |
| 92 | `index.ts` | 14 | Barrel export des 13 composants |

---

## 15. Composants UI

**Répertoire :** `src/components/ui/`
**Total :** 11 fichiers, ~1 305 lignes

| # | Fichier | Lignes | Rôle |
|---|---------|--------|------|
| 93 | `Modal.tsx` | 252 | Dialogues modaux et confirmation |
| 94 | `Stepper.tsx` | 213 | Indicateur de progression multi-étapes |
| 95 | `DataCard.tsx` | 159 | Cartes données financières |
| 96 | `Skeleton.tsx` | 130 | Placeholders de chargement |
| 97 | `ValuationResult.tsx` | 121 | Affichage montant de valorisation |
| 98 | `Avatar.tsx` | 115 | Avatars utilisateur |
| 99 | `Button.tsx` | 106 | Bouton avec variantes |
| 100 | `Card.tsx` | 103 | Container carte générique |
| 101 | `Input.tsx` | 90 | Champ de formulaire |
| 102 | `Badge.tsx` | 43 | Labels/indicateurs de statut |
| 103 | `index.ts` | 13 | Barrel export |

---

## 16. Statistiques globales

| Catégorie | Fichiers | Lignes |
|-----------|----------|--------|
| Prompts (`prompts/`) | 9 | 2 069 |
| Moteur évaluation (`evaluation/`) | 17 | 4 489 |
| Génération PDF (`pdf/`) | 11 | 5 288 |
| Client IA (`anthropic.ts`) | 1 | 186 |
| API Pappers (`pappers.ts`) | 1 | 632 |
| Optimisation IA (`ai/`) | 9 | 3 543 |
| Analyse financière (`analyse/`) | 4 | 860 |
| Usage & quotas (`usage/`) | 3 | 682 |
| Stripe (`stripe/`) | 3 | 274 |
| Sécurité (`security/`) | 5 | 566 |
| Supabase (`supabase/`) | 3 | 139 |
| Autres libs | 4 | 978 |
| Routes API | 8 | 1 980 |
| Composants Chat | 14 | 2 975 |
| Composants UI | 11 | 1 305 |
| **TOTAL** | **103** | **~25 966** |

---

## 17. Graphe de dépendances

### Flow Chat (chemin critique)

```
/chat/[siren]/page.tsx
  └─ ChatLayout.tsx
       └─ ChatInterface.tsx
            ├─ fetch /api/chat (POST)
            │    ├─ prompts/index.ts → getSystemPrompt()
            │    │    ├─ base.ts (BASE_SYSTEM_PROMPT)
            │    │    ├─ flash.ts (FLASH_SYSTEM_PROMPT)
            │    │    ├─ parcours.ts (SYSTEM_PROMPTS par profil)
            │    │    └─ secteurs/*.ts (5 prompts sectoriels)
            │    ├─ anthropic.ts → createStreamWithFallback()
            │    ├─ ai/router.ts → routeToModel()
            │    ├─ ai/cache.ts → checkCache() / saveToCache()
            │    ├─ ai/session-store.ts → getSession() / updateSession()
            │    ├─ ai/context-optimizer.ts → optimiserContexte()
            │    ├─ evaluation/index.ts → evaluerEntrepriseV2()
            │    ├─ usage/evaluations.ts → checkEvaluationAccess()
            │    └─ security/* → requireAuth(), checkRateLimit(), chatBodySchema
            ├─ fetch /api/entreprise/{siren}/quick-valuation (GET)
            │    ├─ pappers.ts → fetchEntreprisePappers()
            │    ├─ evaluation/calculateur-v2.ts → evaluerEntrepriseV2()
            │    └─ analyse/diagnostic.ts → genererDiagnostic()
            ├─ MessageBubble.tsx → FlashValuationDisplay.tsx
            ├─ DownloadReport.tsx
            │    └─ fetch /api/evaluation/pdf (POST)
            │         ├─ pdf/assemble-report-data.ts → assembleReportData()
            │         │    ├─ pdf/generate-qualitative.ts → genererSWOT()
            │         │    └─ evaluation/calculateur-v2.ts
            │         └─ pdf/professional-report-final.tsx → generateProfessionalPDFBuffer()
            │              ├─ professional-report.tsx (composants)
            │              ├─ professional-report-pages.tsx (pages)
            │              ├─ styles.ts + utils.ts
            │              └─ sector-benchmarks.ts
            └─ DocumentUpload.tsx
```

### Flow Paiement

```
Bouton Upgrade (ChatInterface / FlashValuationDisplay)
  └─ fetch /api/stripe/checkout (POST)
       ├─ stripe/client.ts → stripe
       ├─ stripe/plans.ts → PLANS, getPlan()
       ├─ supabase/server.ts → createClient()
       ├─ security/schemas.ts → checkoutBodySchema
       └─ usage/evaluations.ts → createPurchase()

Stripe Webhooks → /api/stripe/webhooks (POST)
  ├─ stripe/client.ts → stripe.webhooks.constructEvent()
  ├─ supabase/server.ts → createServiceClient()
  ├─ usage/evaluations.ts → confirmPurchase()
  └─ emails/send.ts → sendPaymentConfirmation()
```

### Flow Authentification

```
Toutes les requêtes
  └─ middleware.ts
       └─ supabase/middleware.ts → updateSession()
            └─ supabase.auth.getUser()
                 ├─ Routes protégées [/app, /compte, /api/user] → redirect /connexion
                 └─ Routes auth [/connexion, /inscription] → redirect /
```

### Hiérarchie Prompts

```
getSystemPrompt(type, parcours, pedagogy, nafCode)
  ├─ type === 'flash' → FLASH_SYSTEM_PROMPT
  ├─ type === 'complete' → BASE_SYSTEM_PROMPT
  │    ├─ + SYSTEM_PROMPTS[parcours] (cédant/repreneur/dirigeant/conseil)
  │    ├─ + PEDAGOGY_PROMPTS[pedagogy] (débutant/intermédiaire/expert)
  │    └─ + secteur prompt (si NAF détecté)
  │         ├─ COMMERCE_PROMPT
  │         ├─ RESTAURANT_PROMPT
  │         ├─ SAAS_PROMPT
  │         ├─ SERVICES_PROMPT
  │         └─ TRANSPORT_PROMPT
  └─ secteur évaluation (via evaluation/secteurs/)
       └─ detecterSecteurEvaluation(nafCode) → ConfigSecteur
            └─ 15 secteurs : transport, saas, restaurant, commerce,
               ecommerce, services, industrie, btp, pharmacie,
               labo, medecin, dentaire, paramedical, sante, default
```

### Pipeline Évaluation V2

```
Données financières (Pappers + conversation)
  └─ calculerEbitdaNormalise()
       ├─ calculerEbitdaComptable() (par année)
       ├─ getSalaireNormatifDirigeant() (par tranche CA)
       └─ calculerRetraitement*() (7 types)
            └─ EbitdaNormalise {comptable, retraitements[], normalise}

  └─ evaluerEntrepriseV2()
       ├─ Méthode EBITDA (multiple × EBITDA normalisé)
       ├─ Méthode CA (multiple × chiffre d'affaires)
       ├─ Méthode ANC (actif net corrigé)
       ├─ Pondération → FourchetteValorisation {bas, median, haut}
       ├─ calculerDetteNette() → bridge VE → Prix
       └─ Ajustements qualitatifs (risques, qualité)
            └─ ResultatEvaluationV2
```
