# EVALUP — PLAN DE MIGRATION VERS LE MODÈLE ARCHÉTYPES

> **Objectif** : Remplacer le modèle actuel (multiple EBITDA unique + conversation IA générique) par le système d'archétypes (routing automatique + méthode adaptée par profil).
> **Principe clé** : Réécriture from scratch des prompts et de la logique métier. L'ancien sert uniquement de checklist pour ne rien oublier.

---

## TABLE DES MATIÈRES

1. [Synthèse des changements majeurs](#1-synthèse)
2. [Mapping Flow Utilisateur](#2-flow)
3. [Mapping Logique Métier](#3-métier)
4. [Mapping Prompts IA](#4-prompts)
5. [Mapping Données & Sources](#5-données)
6. [Mapping Technique](#6-technique)
7. [Plan d'exécution](#7-exécution)
8. [Risques & Mitigations](#8-risques)

---

## 1. SYNTHÈSE DES CHANGEMENTS MAJEURS

### Ce qui change fondamentalement

| Dimension | ACTUEL | CIBLE | Pourquoi |
|-----------|--------|-------|----------|
| **Proposition de valeur** | "Estimation de la valeur de votre entreprise" | "Diagnostic de votre profil + méthode de valorisation adaptée" | Le diagnostic a plus de valeur perçue qu'un chiffre bancal |
| **Flow d'acquisition** | Inscription obligatoire AVANT toute valeur | Valeur gratuite (diagnostic) → inscription → paiement | Sunk cost : l'utilisateur investit du temps avant le gate |
| **Modèle de valorisation** | 1 modèle unique (EBITDA dominant à 60%) | 15 archétypes avec méthode spécifique chacun | Un SaaS en hyper-croissance ≠ une boulangerie |
| **Source des multiples** | Hardcodés dans le code (origine non documentée) | Damodaran NYU Stern (mis à jour chaque janvier) | Crédibilité + mise à jour automatique annuelle |
| **Résultat Flash gratuit** | Fourchette de valorisation chiffrée | Diagnostic archétype + méthode + erreurs à éviter (PAS de chiffre) | Protège des résultats faux + crée la frustration constructive |
| **Conversation IA post-paiement** | Questions génériques en 6 étapes fixes | Questions spécifiques à l'archétype, ordre et profondeur adaptés | Un cabinet de conseil n'a pas les mêmes enjeux qu'une marketplace |
| **Validation du modèle** | Aucun backtest | Suite de tests Thauvron + cas Damodaran | Filet de sécurité contre les résultats aberrants |

### Ce qui NE change PAS

| Élément | Détail | Pourquoi on garde |
|---------|--------|-------------------|
| Stack technique | Next.js 14 + Supabase + Stripe + Claude + Puppeteer | Solide, pas besoin de changer |
| API Pappers | Récupération données SIREN/bilans/NAF | Fonctionne bien, essentiel pour le routing |
| Structure rapport PDF | 30+ pages, @react-pdf/renderer | Le format est bon, seul le contenu change |
| Calcul VE → Prix de cession | VE - DFN = Prix | Logique financière correcte |
| Retraitements EBITDA | Salaire dirigeant, loyer, crédit-bail, exceptionnel | Bien fait, on l'applique juste aux bons archétypes |
| Décotes et ajustements | Minoritaire, illiquidité, homme-clé, concentration | Application multiplicative correcte, on garde |
| Paiement Stripe | Checkout + webhooks + portal | Infra OK |
| Auth Supabase | Email/password + Google OAuth | OK (activer Google OAuth) |
| Tests E2E Puppeteer | 75 tests modulaires | Adapter les tests, pas l'infra |
| Pages légales | CGV, CGU, RGPD, mentions | Pas de changement |
| Barème salaire dirigeant | Grille par tranche de CA | Réaliste, on garde |

---

## 2. MAPPING FLOW UTILISATEUR

### 2.1 Comparaison des parcours

```
FLOW ACTUEL                              FLOW CIBLE
═══════════                              ══════════

Landing (/)                              Landing (/) — NOUVELLE
  │                                        │
  ├─ CTA → /connexion (obligatoire)        ├─ CTA → /diagnostic (PAS d'auth)
  │         │                              │         │
  │         └─ Inscription/Login           │         ├─ Saisie SIRENE (+ skip)
  │              │                         │         │    └─ API Pappers
  │              v                         │         │
  │         /app (Dashboard SIREN)         │         ├─ 8-10 questions rapides
  │              │                         │         │    (secteur, CA, EBITDA,
  │              └─ Saisie SIREN           │         │     croissance, récurrence,
  │                   │                    │         │     masse sal., effectif,
  │                   v                    │         │     patrimoine?, locatif?)
  │              /chat/[siren]             │         ├─ Loading animé
  │              │                         │         │    "Détection archétype..."
  │              ├─ 8 questions Flash      │         │
  │              │                         │         ├─ GATE INSCRIPTION ←──────┐
  │              ├─ Résultat: FOURCHETTE   │         │    Email + création compte │
  │              │   "500K€ - 800K€"       │         │                           │
  │              │                         │         v                           │
  │              └─ CTA: 79€ pour          │    RÉSULTAT FLASH (DIAGNOSTIC)      │
  │                  le rapport complet    │         │                           │
  │                   │                    │         ├─ Archétype détecté        │
  │                   v                    │         ├─ Méthode recommandée      │
  │              /checkout (Stripe)        │         ├─ 3 erreurs courantes      │
  │                   │                    │         ├─ Facteurs clés            │
  │                   v                    │         │                           │
  │              Retour /chat              │         └─ CTA: 79€ pour rapport   │
  │              (questions illimitées     │              complet par IA         │
  │               + upload + PDF)          │                   │                 │
  │                                        │                   v                 │
  │                                        │              /checkout (Stripe)     │
  │                                        │                   │                 │
  │                                        │                   v                 │
  │                                        │         POST-PAIEMENT              │
  │                                        │              │                     │
  │                                        │              ├─ Chat IA contextuel │
  │                                        │              │  (prompt archétype) │
  │                                        │              ├─ Upload documents   │
  │                                        │              ├─ Rapport PDF 30p    │
  │                                        │              └─ Q&A sur le rapport │
```

### 2.2 Décisions par page

| Page actuelle | Décision | Page cible | Détail |
|---------------|----------|------------|--------|
| `/` (Landing) | **REMPLACER** | `/` (nouvelle landing) | Message "Vous évaluez mal votre entreprise" au lieu de "Estimez la valeur". Focus diagnostic, pas chiffre. |
| `/tarifs` | **SIMPLIFIER** | `/tarifs` | 2 offres au lieu de 4 : Diagnostic gratuit + Rapport complet 79€. Les plans Pro restent mais sont secondaires. |
| `/connexion` | **GARDER** | `/connexion` | Déplacé APRÈS le diagnostic, pas avant. |
| `/inscription` | **GARDER** | `/inscription` | Idem, déplacé après le diagnostic. |
| `/app` (Dashboard SIREN) | **SUPPRIMER** | _(intégré au flow diagnostic)_ | Le SIREN est demandé dans le flow diagnostic, pas besoin d'un dashboard séparé. |
| `/chat/[siren]` (Flash) | **REMPLACER** | `/diagnostic` | Flow en étapes (SIRENE → questions → résultat) au lieu d'un chat. |
| `/chat/[siren]` (Complete) | **GARDER + ADAPTER** | `/evaluation/[id]` | Chat IA post-paiement avec prompt archétype spécifique. |
| `/checkout` | **GARDER** | `/checkout` | Aucun changement technique. |
| `/compte/*` | **GARDER** | `/compte/*` | Brancher sur Supabase/Stripe (actuellement mocké). |
| `/aide` | **GARDER** | `/aide` | Ajouter une FAQ sur les archétypes. |
| Pages légales | **GARDER** | Idem | Aucun changement. |

### 2.3 Nouvelles routes API

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/diagnostic` | Reçoit les 6 réponses → retourne l'archétype détecté |
| GET | `/api/archetypes/[id]` | Retourne les détails d'un archétype (méthode, erreurs, facteurs) |
| POST | `/api/evaluation/start` | Post-paiement : initialise la conversation IA avec le prompt archétype |
| GET | `/api/multiples/[sector]` | Retourne les multiples Damodaran pour un secteur |

### 2.4 Routes API à garder telles quelles

| Route | Raison |
|-------|--------|
| `GET /api/entreprise/[siren]` | Pappers, fonctionne bien |
| `GET /api/entreprise/[siren]/quick-valuation` | Adapter pour utiliser les archétypes |
| `POST /api/chat` | Adapter le prompt, garder l'infra |
| `POST /api/evaluation/pdf` | Adapter le contenu, garder le rendu |
| `POST /api/stripe/*` | Aucun changement |
| `GET /api/auth/callback` | Aucun changement |

---

## 3. MAPPING LOGIQUE MÉTIER

### 3.1 Modèle de valorisation

| Élément actuel | Décision | Élément cible |
|----------------|----------|---------------|
| Pondération fixe 60% EBITDA / 25% CA / 15% ANC pour tous | **REMPLACER** | Pondération définie PAR ARCHÉTYPE (ex: SaaS hyper = 100% ARR, Patrimoine = 100% ANR) |
| 9 multiples sectoriels hardcodés | **REMPLACER** | Multiples Damodaran 2026 (~95 secteurs) mappés vers les 15 archétypes |
| Multiple EBITDA comme méthode universelle | **REMPLACER** | Méthode principale dépend de l'archétype (ARR, EBITDA, ANR, CA, DCF, Praticiens) |
| Ajustements taille/localisation/croissance | **GARDER + CALIBRER** | Mêmes ajustements mais coefficients calibrés avec données Damodaran |
| Décotes (minoritaire, illiquidité, homme-clé) | **GARDER TEL QUEL** | Application multiplicative avec plafond 40-45% — correct |
| Retraitements EBITDA (salaire, loyer, CB) | **GARDER TEL QUEL** | Appliqués uniquement aux archétypes EBITDA-based |
| Barème salaire normatif dirigeant | **GARDER TEL QUEL** | Grille réaliste |
| Passage VE → Prix de cession (DFN) | **GARDER TEL QUEL** | Logique financière correcte |

### 3.2 Routing vers l'archétype

**NOUVEAU** — Logique de détection automatique à implémenter :

```
DONNÉES D'ENTRÉE (10 questions + Pappers)
│
├─ P1 (prioritaire) :
│   ├─ CA = 0 et R&D > 0 → #15 Pre-revenue / Deep Tech
│   └─ EBITDA < 0 ET Croissance > 40% ET MRR > 0 → #1 SaaS Hyper-croissance
│
├─ P2 :
│   ├─ Actifs / CA > 5x → #11 Patrimoine dominant
│   ├─ Revenus locatifs > 50% CA → #10 Société patrimoniale
│   └─ CA < 300K€ ET Effectif ≤ 2 → #14 Micro-entreprise
│
├─ P3 :
│   ├─ EBITDA < 0 ET Croissance < 20% ET CA > 500K€ → #12 Gros CA, déficit
│   └─ Masse salariale / CA > 60% → #13 Grosse masse salariale
│
├─ P4 (secteur + métriques) :
│   ├─ MRR > 0 ET Récurrence > 80% ET Croissance > 40% → #1 SaaS Hyper-croissance
│   ├─ MRR > 0 ET Récurrence > 80% ET Croissance 5-40% → #2 SaaS Mature
│   ├─ MRR > 0 ET Récurrence > 60% ET Croissance < 5% → #3 SaaS Déclin
│   ├─ Code NAF marketplace ET GMV > 0 → #4 Marketplace
│   └─ Code NAF e-commerce → #5 E-commerce
│
├─ P5 (secteur classique) :
│   ├─ Code NAF services/conseil → #6 Conseil
│   ├─ Récurrence > 60% ET service physique → #7 Services récurrents
│   ├─ Code NAF commerce + PDV physique → #8 Commerce / Retail
│   └─ Code NAF industrie → #9 Industrie
│
└─ P6 (fallback) :
    └─ Aucune condition → ⚠️ "Profil atypique — analyse personnalisée"
```

### 3.3 Correspondance secteurs actuels → archétypes

| Secteur actuel (15) | Archétype cible | Changement de méthode |
|---------------------|-----------------|----------------------|
| SaaS / Software | #1, #2 ou #3 (selon croissance/rentabilité) | OUI — routing dynamique au lieu de méthode fixe |
| Restaurant | #8 Commerce / Retail | NON — reste fonds de commerce + EBITDA |
| Commerce | #8 Commerce / Retail | NON |
| E-commerce | #5 E-commerce / D2C | LÉGER — ajout métriques D2C |
| Transport | #9 Industrie (variante) | NON |
| BTP | #9 Industrie | NON |
| Industrie | #9 Industrie | NON |
| Services | #6 Conseil OU #7 Services récurrents | OUI — split en 2 archétypes |
| Pharmacie | #8 Commerce (variante santé) | LÉGER |
| Labo / Médecin / Dentaire / Paramédical | #14 Micro / Solo OU #6 Conseil | OUI — selon taille |
| Santé (générique) | Routing dynamique | OUI |
| Default | Fallback → "Profil atypique" | OUI |

---

## 4. MAPPING PROMPTS IA

### 4.1 Hiérarchie actuelle vs cible

```
ACTUEL                                    CIBLE
══════                                    ═════

BASE_SYSTEM_PROMPT (620 lignes)           ARCHETYPE_PROMPT_[ID] (1 par archétype)
  └─ Règles générales                       ├─ Contexte archétype
  └─ Méthodologie unique                    ├─ Méthode spécifique
  └─ Progression 6 étapes fixes             ├─ Questions spécifiques (ordonnées)
                                            ├─ Multiples Damodaran (injectés)
FLASH_SYSTEM_PROMPT (142 lignes)            ├─ Facteurs d'ajustement
  └─ 8 questions max                        ├─ Red flags à détecter
  └─ Format simplifié                       ├─ Format de sortie
                                            └─ Exemples de réponses attendues
PROMPT_SECTORIEL (15 prompts)
  └─ 5 manuels + 10 auto-générés         DONNÉES_INJECTÉES (dynamiques)
                                            ├─ Données Pappers (auto)
PROMPT_PARCOURS (5 intentions)              ├─ Réponses utilisateur (flash)
  └─ Vente / Achat / Associé / etc.        ├─ Multiples Damodaran secteur
                                            ├─ Archétype détecté
                                            └─ Intention (vente/achat/etc.)
```

### 4.2 Décisions par prompt

| Prompt actuel | Décision | Prompt cible |
|---------------|----------|-------------|
| BASE_SYSTEM_PROMPT (620 lignes) | **RÉÉCRIRE FROM SCRATCH** | 15 prompts archétype (~200-300 lignes chacun) qui incluent les règles pertinentes |
| FLASH_SYSTEM_PROMPT (142 lignes) | **SUPPRIMER** | Le Flash ne passe plus par Claude — c'est un formulaire statique + routing code |
| 5 prompts sectoriels manuels | **ABSORBER** dans les prompts archétype | Les bonnes questions sectorielles sont redistribuées dans les archétypes |
| 10 prompts sectoriels auto-générés | **SUPPRIMER** | Remplacés par les prompts archétype (qualité supérieure) |
| 5 prompts parcours (vente/achat/etc.) | **GARDER COMME MODULE** | Injecté en complément du prompt archétype (pas remplacé) |

### 4.3 Règles à conserver dans les nouveaux prompts

| Règle actuelle | Garder ? | Note |
|----------------|----------|------|
| Une seule question à la fois | ✅ OUI | Fondamental pour l'UX chat |
| Année de référence dynamique (avant/après juin) | ✅ OUI | Logique correcte |
| Benchmark obligatoire vs secteur | ✅ OUI | "Ta marge de 3% est en-dessous de la moyenne de 5-8%" |
| Suggestions uniquement qualitatif | ✅ OUI | Pas de suggestions pour les montants |
| Connaissance des documents uploadés | ✅ OUI | Ne pas reposer une question déjà répondue |
| Sélection Haiku/Sonnet selon complexité | ⚠️ ADAPTER | Haiku pour collecte, Sonnet pour analyse + rapport |
| Prompt caching | ✅ OUI | Garder l'optimisation tokens |

### 4.4 Structure type d'un prompt archétype (post-paiement)

```
ARCHETYPE_PROMPT_SAAS_MATURE = {
  role: "system",
  content: `
    # CONTEXTE
    Tu es un expert en valorisation d'entreprises SaaS matures et rentables.
    L'entreprise [NOM] a été identifiée comme un profil "SaaS Mature & Rentable".
    
    # DONNÉES DÉJÀ COLLECTÉES
    - SIREN: [X] — Données Pappers: [injectées]
    - CA: [X]€ — EBITDA: [X]€ — Croissance: [X]%
    - Récurrence: [X]% — Masse salariale: [X]%
    
    # MÉTHODE DE VALORISATION
    Méthode principale: Multiple d'EBITDA + validation ARR
    Méthode secondaire: DCF 5 ans avec terminal value
    
    Multiples de référence (Damodaran, janvier 2026):
    - EV/EBITDA médian secteur Software (System & Application): [X]x
    - EV/Revenue médian: [X]x
    - Ajustement France vs US: -20% à -30%
    
    # QUESTIONS À POSER (dans cet ordre)
    Phase 1 — Métriques SaaS (3-4 questions):
    1. MRR actuel et évolution sur 12 mois
    2. Taux de churn mensuel (logo churn et revenue churn)
    3. NRR (Net Revenue Retention) si connu
    4. Répartition ARR par type de plan
    
    Phase 2 — Rentabilité (2-3 questions):
    5. Rémunération complète du dirigeant
    6. Coût d'acquisition client (CAC) moyen
    7. Dépenses R&D en % du CA
    
    Phase 3 — Risques (2-3 questions):
    8. Concentration clients (% top 3)
    9. Dépendance technologique ou homme-clé
    10. Litiges ou contentieux en cours
    
    # CALCUL
    [Formules spécifiques à appliquer]
    
    # FORMAT DE SORTIE
    [Structure du résultat et du rapport]
    
    # RÈGLES
    - UNE question à la fois
    - Benchmark chaque réponse vs secteur
    - Si une donnée semble incohérente, challenger poliment
    - Toujours en français
  `
}
```

---

## 5. MAPPING DONNÉES & SOURCES

### 5.1 Multiples sectoriels

| Actuel | Cible |
|--------|-------|
| 9 secteurs hardcodés dans le code | Fichier JSON généré depuis Damodaran Excel |
| Source non documentée | Source: stern.nyu.edu/~adamodar/pc/datasets/vebitda.xls |
| Pas de mise à jour prévue | Mise à jour manuelle chaque janvier (Damodaran publie en janvier) |
| Multiples France uniquement | Multiples US + ajustement France (-20 à -30%) documenté |

**Action** : Télécharger vebitda.xls + psdata.xls → parser en JSON → mapper les ~95 catégories Damodaran vers les 15 archétypes → stocker dans `/data/multiples.json`

### 5.2 Cas de test (backtest)

| Source | Usage | Accès |
|--------|-------|-------|
| **Thauvron** (thauvron.com) | Exercices corrigés valorisation, PDF + Excel gratuits | Gratuit, chapitres 2-8 |
| **Vernimmen** (vernimmen.net) | Cas d'évaluation avec données complètes | Gratuit (section "S'entraîner") |
| **Damodaran** (NYU Stern) | Valorisations complètes d'entreprises réelles (Con Ed, 3M, S&P 500) | Gratuit, spreadsheets Excel |
| **CCMP** (ccmp.fr) | Cas "BANCO" (valorisation PME), "Emprunte Mon Toutou" (startup DCF) | Payant (~10€/cas) |

**Action** : Créer `/tests/valuation-cases/` avec 10-15 cas couvrant les archétypes principaux. Format: `{ inputs, archetype_expected, valuation_expected_range }`. Lancer à chaque modification du modèle.

### 5.3 Données Pappers (inchangé)

| Donnée | Usage actuel | Usage cible |
|--------|-------------|-------------|
| SIREN/SIRET | Identification | Idem |
| Code NAF | Détection secteur (15 secteurs) | Input pour le routing archétype |
| Bilans (CA, résultat, effectif) | Injectés dans le chat | Injectés dans le routing + chat |
| Dirigeants | Affichage info | Idem |
| BODACC | Scraping | Idem |

---

## 6. MAPPING TECHNIQUE

### 6.1 Fichiers à modifier

| Fichier/Module | Action | Détail |
|----------------|--------|--------|
| `app/page.tsx` (Landing) | RÉÉCRIRE | Nouveau message "Vous évaluez mal votre entreprise" |
| `app/diagnostic/page.tsx` | CRÉER | Nouveau flow: SIRENE → questions → résultat archétype |
| `app/app/page.tsx` (Dashboard SIREN) | SUPPRIMER ou REDIRECT | Redirige vers /diagnostic |
| `app/chat/[siren]/page.tsx` | ADAPTER | Post-paiement uniquement, prompt archétype |
| `lib/valuation/calculator.ts` | RÉÉCRIRE | Routing archétype + méthodes spécifiques |
| `lib/valuation/archetypes.ts` | CRÉER | Définition des 15 archétypes + règles de routing |
| `lib/valuation/multiples.ts` | CRÉER | Chargement et application des multiples Damodaran |
| `lib/prompts/base.ts` | RÉÉCRIRE | 15 prompts archétype au lieu de 1 prompt base |
| `lib/prompts/flash.ts` | SUPPRIMER | Le flash ne passe plus par Claude |
| `lib/prompts/sectors/*.ts` | SUPPRIMER | Absorbés dans les prompts archétype |
| `lib/prompts/parcours.ts` | GARDER | Module complémentaire (vente/achat/etc.) |
| `data/multiples.json` | CRÉER | Multiples Damodaran parsés |
| `tests/valuation-cases/` | CRÉER | Suite de tests backtest |
| `app/tarifs/page.tsx` | SIMPLIFIER | 2 offres principales au lieu de 4 |
| `app/api/diagnostic/route.ts` | CRÉER | Endpoint routing archétype |
| `app/api/chat/route.ts` | ADAPTER | Injection prompt archétype |
| `app/api/evaluation/pdf/route.ts` | ADAPTER | Contenu adapté à l'archétype |

### 6.2 Fichiers inchangés

| Fichier/Module | Raison |
|----------------|--------|
| `app/(auth)/*` | Auth fonctionne, juste déplacer le moment où on le demande |
| `app/(legal)/*` | Aucun changement |
| `app/aide/*` | Ajouter FAQ archétypes, mais structure OK |
| `app/compte/*` | Brancher sur Supabase (tâche séparée) |
| `app/checkout/*` | Stripe OK |
| `app/api/stripe/*` | Webhooks OK |
| `app/api/entreprise/*` | Pappers OK |
| `middleware.ts` | Adapter les routes protégées |
| `tests/` (infra) | Adapter les tests, pas l'infra Puppeteer |

---

## 7. PLAN D'EXÉCUTION

### Phase 1 — Fondations (3-5 jours)
- [ ] Créer `lib/valuation/archetypes.ts` — 15 archétypes + règles de routing
- [ ] Télécharger et parser les multiples Damodaran → `data/multiples.json`
- [ ] Créer `lib/valuation/multiples.ts` — chargement + application
- [ ] Créer les cas de test Thauvron → `tests/valuation-cases/`
- [ ] Valider le routing : chaque cas de test → bon archétype

### Phase 2 — Flow utilisateur (3-5 jours)
- [ ] Réécrire la landing page `/`
- [ ] Créer `/diagnostic` (SIRENE → questions → loading → signup → résultat)
- [ ] Adapter `/tarifs` (2 offres principales)
- [ ] Supprimer/redirect `/app` vers `/diagnostic`
- [ ] Adapter le middleware (routes protégées)
- [ ] Tracker les events GA4 sur chaque étape

### Phase 3 — Prompts IA (5-7 jours)
- [ ] Écrire les 15 prompts archétype from scratch
- [ ] Intégrer l'injection des multiples Damodaran dans les prompts
- [ ] Garder le module parcours (vente/achat/etc.) en complément
- [ ] Adapter `/api/chat` pour injecter le prompt archétype
- [ ] Tester chaque archétype avec 2-3 conversations complètes
- [ ] Valider les résultats contre les cas Thauvron

### Phase 4 — Rapport PDF (2-3 jours)
- [ ] Adapter la structure du rapport par archétype
- [ ] Intégrer la page "Votre profil : [archétype]" dans le rapport
- [ ] Ajouter les benchmarks Damodaran dans le rapport
- [ ] Tester la génération PDF pour 3-4 archétypes

### Phase 5 — Tests & QA (2-3 jours)
- [ ] Adapter les 75 tests E2E au nouveau flow
- [ ] Lancer la suite de backtest complète
- [ ] Tester les 4 full-flows (boulangerie, agence, restaurant, cabinet)
- [ ] Test mobile complet
- [ ] Review finale : aucun résidu de l'ancien système

### Total estimé : 15-23 jours de dev

---

## 8. RISQUES & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Résidus de l'ancien système dans les prompts | ÉLEVÉ | Le modèle mélange ancien et nouveau | Checklist de suppression : lister TOUS les fichiers de l'ancien système et confirmer suppression/remplacement |
| Routing vers le mauvais archétype | MOYEN | L'utilisateur reçoit des conseils inadaptés | Suite de tests Thauvron + fallback "Profil atypique" si score de confiance < 70% |
| Multiples Damodaran inadaptés au marché français PME | MOYEN | Surévaluation (multiples US > FR) | Appliquer systématiquement la décote France -20/-30% documentée |
| Perte de fonctionnalités existantes | MOYEN | Feature manquante découverte en prod | Checklist des features actuelles + test de non-régression |
| Conversion plus basse avec le nouveau flow | MOYEN | Moins de paiements | A/B test : garder l'ancien flow sur une variante pendant 2 semaines |
| Qualité des prompts archétype inégale | ÉLEVÉ | Certains archétypes donnent des résultats médiocres | Commencer par les 5 archétypes les plus fréquents, itérer |

### Checklist de suppression (anti-résidu)

Avant de déployer, vérifier que ces éléments ont été **explicitement supprimés ou remplacés** :

- [ ] `FLASH_SYSTEM_PROMPT` → supprimé (le flash est un formulaire, plus un chat)
- [ ] `BASE_SYSTEM_PROMPT` (620 lignes) → remplacé par 15 prompts archétype
- [ ] 10 prompts sectoriels auto-générés → supprimés
- [ ] Pondération fixe 60/25/15 → supprimée, remplacée par pondération par archétype
- [ ] 9 multiples hardcodés → supprimés, remplacés par Damodaran JSON
- [ ] Page `/app` (dashboard SIREN) → supprimée ou redirigée
- [ ] Résultat Flash chiffré (fourchette €) → remplacé par diagnostic archétype
- [ ] Limite "8 questions max" → supprimée (le flash est un formulaire, pas un chat)
- [ ] Message "limite atteinte" → supprimé
- [ ] Input chat désactivé après flash → supprimé (pas de chat en flash)
