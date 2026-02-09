# EvalUp v2 - Spécifications Complètes

> **Document de référence** pour le développement d'EvalUp
> Dernière mise à jour : Janvier 2025
> À placer à la racine du projet

---

## Table des matières

1. [Flow Utilisateur](#1-flow-utilisateur)
2. [Modèle de Données](#2-modèle-de-données)
3. [Module Retraitements EBITDA](#3-module-retraitements-ebitda)
4. [Module Analyse des Risques](#4-module-analyse-des-risques)
5. [Module Décotes et Primes](#5-module-décotes-et-primes)
6. [Méthodes de Valorisation](#6-méthodes-de-valorisation)
7. [Multiples Sectoriels de Référence](#7-multiples-sectoriels-de-référence)
8. [Barèmes Fonds de Commerce](#8-barèmes-fonds-de-commerce)
9. [Pédagogie Adaptative](#9-pédagogie-adaptative)
10. [Structure du Rapport](#10-structure-du-rapport)
11. [Contrôle Qualité](#11-contrôle-qualité)
12. [Règles de Conversation](#12-règles-de-conversation)

---

## 1. Flow Utilisateur

### 1.1 Vue d'ensemble du parcours

```
ÉTAPE 1 : SIREN
└── "Entrez le SIREN de l'entreprise à évaluer"
         │
         ▼
ÉTAPE 2 : CONFIRMATION + BENTO GRID
├── Affichage données Pappers (nom, CA, effectif, NAF)
├── "Est-ce bien cette entreprise ?"
└── 📦 Stockage : financials[2023], financials[2022], financials[2021] avec source='pappers'
         │
         ▼
ÉTAPE 3 : OBJECTIF
├── "Quel est l'objectif de cette valorisation ?"
│
├── 💰 VENTE - Je veux vendre mon entreprise
├── 🛒 ACHAT - Je veux racheter cette entreprise
├── 🤝 ASSOCIÉ - Rachat ou sortie d'associé
├── 💔 DIVORCE - Séparation de patrimoine
├── 👨‍👩‍👧 TRANSMISSION - Donation familiale
├── ⚖️ CONFLIT - Litige entre associés
├── 🏦 FINANCEMENT - Banque, levée de fonds
└── 📊 PILOTAGE - Comprendre ma valeur
         │
         ▼
ÉTAPE 4 : OBJET (si objectif ≠ pilotage)
├── "Que souhaitez-vous valoriser ?"
│
├── ✓ L'entreprise entière (100% des parts)
├── ✓ Une partie des parts → [Quel % ? ____]
└── ✓ Le fonds de commerce uniquement
         │
         ▼
ÉTAPE 5 : PROFIL & NIVEAU
├── "Quel est votre profil ?"
│   ├── 🤵 Propriétaire/Dirigeant
│   ├── 🛒 Acquéreur potentiel
│   └── 📋 Professionnel (EC, avocat, banquier)
│
└── "Niveau de familiarité avec la valorisation ?"
    ├── 🟢 Débutant - Expliquez-moi tout
    ├── 🟡 Intermédiaire - Je connais les bases
    └── 🔴 Expert - Données brutes
         │
         ▼
ÉTAPE 6 : DOCUMENTS
├── "Avez-vous des documents comptables à partager ?"
├── [📁 Oui, j'uploade] → Extraction automatique
└── [⏭️ Non, continuons] → Questions
         │
         ▼
ÉTAPE 7 : ANALYSE DES GAPS (automatique)
├── Construction matrice disponibilité données par année
└── Génération liste questions manquantes
         │
         ▼
ÉTAPE 8 : QUESTIONS INTELLIGENTES
├── Phase A : Données financières manquantes
├── Phase B : Retraitements (TOUJOURS)
├── Phase C : Risques (TOUJOURS)
└── Phase D : Décotes (si applicable)
         │
         ▼
ÉTAPE 9 : GÉNÉRATION RAPPORT PDF
```

### 1.2 Matrice Objectif × Profil × Comportement

| Objectif | Profil | Ton | Focus | Décotes |
|----------|--------|-----|-------|---------|
| Vente | Propriétaire | Optimiste, stratégique | Maximiser valeur | Non |
| Achat | Acquéreur | Prudent, analytique | Risques, prix max | Non |
| Associé (rachat) | Propriétaire | Factuel | Valeur équitable | Oui |
| Associé (sortie) | Propriétaire | Défensif | Valeur max parts | Oui |
| Divorce | Propriétaire | Neutre, factuel | Objectivité | Selon contexte |
| Transmission | Propriétaire | Bienveillant | Optimisation fiscale | Oui (donation) |
| Conflit | Propriétaire | Diplomatique | Équité | Selon position |
| Financement | Propriétaire | Professionnel | Ratios, garanties | Non |
| Pilotage | Propriétaire | Pédagogique | Compréhension | Non |

---

## 2. Modèle de Données

### 2.1 Structure principale de session

```typescript
interface EvalupSession {
  // IDENTIFICATION
  id: string;
  siren: string;
  companyName: string;
  nafCode: string;
  nafLabel: string;

  // CONTEXTE VALORISATION
  objectif: 'vente' | 'achat' | 'associe_rachat' | 'associe_sortie' |
            'divorce' | 'transmission' | 'conflit' | 'financement' | 'pilotage';
  objet: 'titres_100' | 'titres_partiel' | 'fonds_commerce';
  pourcentageParts?: number;
  profil: 'proprietaire' | 'acquereur' | 'conseil';
  pedagogyLevel: 'fort' | 'moyen' | 'expert';

  // DONNÉES FINANCIÈRES PAR ANNÉE
  financials: {
    [year: string]: YearFinancials;
  };
  availableYears: string[];
  referenceYear: string;

  // RETRAITEMENTS
  retraitements: Retraitement[];
  ebitdaRetraite: { [year: string]: number };
  ebitdaRetraiteMoyen: number;

  // RISQUES
  risques: Risque[];
  provisionsRecommandees: number;

  // DÉCOTES
  decotes: Decote[];
  decoteTotale: number;

  // RÉSULTAT
  valorisation: ValorisationResult;
}
```

### 2.2 Données financières par année

```typescript
interface YearFinancials {
  year: string;

  // Compte de résultat
  ca?: number;
  ebe?: number;
  ebitda?: number;
  resultatExploitation?: number;
  resultatNet?: number;
  chargesPersonnel?: number;
  dotationsAmortissements?: number;
  chargesExceptionnelles?: number;
  produitsExceptionnels?: number;

  // Bilan
  capitauxPropres?: number;
  dettesFinancieres?: number;
  tresorerie?: number;
  stocks?: number;
  creancesClients?: number;

  // Indicateurs
  effectif?: number;

  // Source de chaque donnée
  sources: {
    [field: string]: {
      origin: 'pappers' | 'document_uploaded' | 'user_declared';
      confidence: 'high' | 'medium' | 'low';
    }
  };
}
```

### 2.3 Retraitements

```typescript
interface Retraitement {
  type: 'salaire_dirigeant_sous' | 'salaire_dirigeant_sur' |
        'salaire_famille' | 'avantage_nature' |
        'loyer_sur' | 'loyer_sous' |
        'charge_exceptionnelle' | 'produit_exceptionnel' |
        'credit_bail' | 'autre';
  label: string;
  montants: { [year: string]: number };
  montantMoyen: number;
  impact: 'augmente' | 'diminue'; // Impact sur EBITDA retraité
  justification: string;
}
```

### 2.4 Risques

```typescript
interface Risque {
  type: 'prudhommes' | 'fiscal' | 'urssaf' | 'commercial' |
        'dependance_client' | 'dependance_dirigeant' |
        'disruption_techno' | 'dependance_plateforme' | 'autre';
  categorie: 'interne' | 'externe' | 'sectoriel';
  gravite: 'faible' | 'moyen' | 'eleve' | 'critique';
  description: string;
  impactType: 'provision' | 'decote' | 'alerte_only';
  montantProvision?: number;
  decoteSuggere?: number;
}
```

### 2.5 Décotes

```typescript
interface Decote {
  type: 'minoritaire' | 'illiquidite' | 'homme_cle' |
        'clause_agrement' | 'prime_controle';
  pourcentage: number;       // Ex: 0.20 = 20%
  fourchetteBasse: number;
  fourchetteHaute: number;
  applicable: boolean;
  justification: string;
}
```

---

## 3. Module Retraitements EBITDA

### 3.1 Principe

L'EBITDA comptable ne reflète pas la rentabilité "normative" pour un acquéreur.
**L'EBITDA retraité est la BASE de la valorisation par les multiples.**

### 3.2 Questions obligatoires

#### Rémunération dirigeant

```
QUESTION :
"Quelle est la rémunération annuelle totale du dirigeant ?"
- Salaire brut annuel : [____] €
- Charges sociales : [____] € (ou ~45% du brut)

"Le dirigeant se verse-t-il principalement des dividendes ?"
○ Non  ○ Oui (salaire < 50K€)

"Stable sur 3 ans ?"
○ Oui  ○ Non → préciser par année
```

**Rémunération normative (référence) :**
| Taille (CA) | Salaire normatif chargé |
|-------------|------------------------|
| < 1M€ | 80-100 K€ |
| 1-5M€ | 100-150 K€ |
| 5-20M€ | 150-200 K€ |
| > 20M€ | 200-300 K€ |

**Règle :**
- Si salaire réel < normatif → EBITDA retraité = EBITDA + écart (valeur DIMINUE)
- Si salaire réel > normatif → EBITDA retraité = EBITDA - écart (valeur AUGMENTE)

#### Avantages en nature

```
QUESTION :
"Avantages en nature pris en charge par l'entreprise ?"
□ Véhicule de fonction → [____] €/mois
□ Logement → [____] €/mois
□ Autres (voyages, clubs) → [____] €/an
□ Aucun
```

#### Salariés famille

```
QUESTION :
"Des membres de la famille sont-ils salariés ?"
○ Non
○ Oui → Qui, poste, salaire, activité réelle justifiée ?
```

**Règle :** Salaires non justifiés → réintégrer dans EBITDA retraité.

#### Loyers

```
QUESTION :
"Les locaux appartiennent-ils au dirigeant ou SCI liée ?"
○ Non (locataire tiers)
○ Oui → Loyer actuel [____] €/an, conforme au marché ?
```

**Règle :** Ajuster EBITDA de l'écart loyer réel vs marché.

#### Charges exceptionnelles

```
QUESTION :
"Charges exceptionnelles ces 3 dernières années ?"
□ Procès / indemnités → Année [____] Montant [____] €
□ Déménagement / travaux → ...
□ Restructuration → ...
□ Aucune
```

**Règle :** Charges non récurrentes → réintégrer dans EBITDA.

#### Produits exceptionnels

```
QUESTION :
"Produits exceptionnels ces 3 dernières années ?"
□ Plus-value cession
□ Subvention COVID
□ Indemnité assurance
□ Aucun
```

**Règle :** Produits non récurrents → retirer de l'EBITDA.

### 3.3 Calcul EBITDA retraité

```
EBITDA retraité (année N) =
    EBITDA comptable
  + Excédent salaire dirigeant (si sur-payé)
  - Déficit salaire dirigeant (si sous-payé)
  + Salaires famille non justifiés
  + Excédent loyer (si sur-loyer)
  - Déficit loyer (si sous-loyer)
  + Charges exceptionnelles non récurrentes
  - Produits exceptionnels non récurrents

EBITDA retraité moyen =
  (EBITDA_N × 3 + EBITDA_N-1 × 2 + EBITDA_N-2 × 1) / 6
```

---

## 4. Module Analyse des Risques

### 4.1 Risques internes - Questions obligatoires

#### Litiges sociaux

```
QUESTION :
"Procédures prud'homales en cours ?"
○ Non
○ Oui → Nombre [____], Montant réclamé [____] €, Stade [____]
```

**Impact :** Provision = montant × probabilité condamnation

#### Risques fiscaux

```
QUESTIONS :
"Contrôle fiscal en cours ?" ○ Non ○ Oui
"Contrôle fiscal < 3 ans ?" ○ Non ○ Oui → Résultat ?
"Notification de redressement ?" ○ Non ○ Oui → Montant [____] €
```

#### Risques URSSAF

```
"Contrôle URSSAF en cours ou récent ?" ○ Non ○ Oui
"Avantages non déclarés ?" ○ Non ○ Oui
```

#### Engagements hors bilan

```
"Cautions ou garanties données ?"
□ Cautions bancaires [____] €
□ Garanties tiers [____] €
□ Crédit-bail restant [____] €
□ Aucun
```

### 4.2 Dépendances critiques

#### Concentration client

```
"% CA du plus gros client ?" [____] %
"% CA des 3 plus gros ?" [____] %
"Contrats long terme (>1 an) ?" ○ Oui ○ Non
```

**Alertes :**
- Top 1 > 30% : ⚠️ Alerte
- Top 1 > 50% : 🔴 Critique → décote possible
- Top 3 > 70% : ⚠️ Alerte

#### Dépendance dirigeant

```
"Niveau de dépendance au dirigeant ?"
○ Faible (équipe autonome, process documentés)
○ Moyen (transition 6-12 mois nécessaire)
○ Fort (tout repose sur le dirigeant)

"Prêt à accompagner la transition ?"
○ Oui, [____] mois ○ Non
```

**Impact :**
| Dépendance | Transition | Décote |
|------------|------------|--------|
| Faible | - | 0% |
| Moyenne | Oui | 5% |
| Moyenne | Non | 10-15% |
| Forte | Oui | 10-15% |
| Forte | Non | 20-25% |

### 4.3 Risques sectoriels (selon NAF)

#### Si Tech / SaaS

```
"Menacé par l'IA générative ?" ○ Non ○ Partiellement ○ Oui
"MRR actuel ?" [____] € "Il y a 6 mois ?" [____] €
"Churn mensuel ?" [____] %
"% revenus récurrents ?" [____] %
```

**Alertes SaaS :**
- MRR -10% sur 6 mois : ⚠️
- MRR -20% sur 6 mois : 🔴
- Churn > 5%/mois : ⚠️

#### Si dépendance plateforme

```
"% activité dépendant de :"
- Apple/Google : [____] %
- Amazon : [____] %
- Meta/Google Ads : [____] %
```

### 4.4 Tableau impacts

| Risque | Gravité faible | Moyenne | Élevée | Critique |
|--------|---------------|---------|--------|----------|
| Prud'hommes | Alerte | Provision 50% | Provision 80% | Provision 100% |
| Fiscal | - | Provision 50% | Provision 80% | Provision 100% |
| Concentration client | - | Alerte | Décote 5-10% | Décote 15-20% |
| Dépendance dirigeant | - | Décote 5-10% | Décote 15-20% | Décote 20-25% |
| Disruption techno | Alerte | Décote 10% | Décote 20-30% | Multiple ÷ 2 |

---

## 5. Module Décotes et Primes

### 5.1 Types de décotes

| Type | Quand | Fourchette |
|------|-------|------------|
| **Minoritaire** | Parts < 50% | 15-25% |
| **Illiquidité** | Titres non cotés | 10-20% |
| **Homme-clé** | Forte dépendance dirigeant | 10-25% |
| **Clause agrément** | Statuts restrictifs | 5-15% |
| **Prime contrôle** | Bloc > 50% | +15-30% |

### 5.2 Questions pour calibrer

```
"% du capital concerné ?" [____] %
"Clause d'agrément dans les statuts ?" ○ Oui ○ Non
"Pacte d'actionnaires restrictif ?" ○ Oui ○ Non
"Le dirigeant reste-t-il après la transaction ?" ○ Oui ○ Non
```

### 5.3 Cumul des décotes

```
Décote totale = 1 - [(1 - décote1) × (1 - décote2) × ...]

Exemple :
- Minoritaire 20% + Illiquidité 15% + Homme-clé 10%
- Total = 1 - (0.80 × 0.85 × 0.90) = 38.8%

⚠️ Plafond recommandé : 40-45%
```

### 5.4 Application

```
Valeur avant décotes = EV - Dette nette + Trésorerie excédentaire
Valeur après décotes = Valeur avant × (1 - Décote totale)
Si parts partielles : Valeur parts = Valeur après × % parts
```

---

## 6. Méthodes de Valorisation

### 6.1 Pour les TITRES

#### Méthode Multiple EBITDA (principale)

```
Valeur Entreprise (EV) = EBITDA retraité moyen × Multiple sectoriel

Valeur Titres = EV - Dettes financières nettes + Trésorerie excédentaire - Provisions
```

**Ajustements multiple :**
| Facteur | Impact |
|---------|--------|
| Paris/IDF | +0.5 à +1.0 |
| Croissance > 10%/an | +0.5 à +1.0 |
| Croissance négative | -0.5 à -1.0 |
| CA < 1M€ | -1.0 à -1.5 |
| Récurrence > 70% | +1.0 à +2.0 |

#### Méthode Actif Net Corrigé (ANC)

```
ANC = Actif total réévalué - Passif total
```

**Utiliser si :** holding, immobilier, entreprise en perte, valorisation plancher.

#### DCF simplifié (optionnel)

```
Valeur = Σ [FCF / (1+WACC)^n] + Valeur Terminale

Hypothèses PME par défaut :
- Croissance CA : min(moyenne 3 ans, 5%)
- Marge EBITDA : stable
- CAPEX : = amortissements
- WACC : 12-15%
- g (croissance perpétuelle) : 2%
```

### 6.2 Pour les FONDS DE COMMERCE

#### Barèmes sectoriels (% CA)

```
Valeur = CA moyen 3 ans × Coefficient sectoriel
```

Voir section 8 pour les coefficients.

#### Multiple EBE

```
Valeur = EBE retraité moyen × 2.5 à 4
```

### 6.3 Synthèse multi-méthodes

**Toujours croiser au moins 2 méthodes.**

PME classique : 60% Multiple EBITDA + 30% ANC + 10% DCF
Holding : 20% Multiple + 70% ANC + 10% autres
Fonds de commerce : 50% Barème CA + 50% Multiple EBE

---

## 7. Multiples Sectoriels de Référence

### France 2024-2025

| Secteur | Multiple bas | Médian | Haut |
|---------|--------------|--------|------|
| Tech / SaaS | 5.0 | 7.0 | 10.0 |
| Santé / Pharma | 5.5 | 7.0 | 9.0 |
| Services B2B | 4.5 | 5.5 | 7.0 |
| Industrie | 4.0 | 5.0 | 6.5 |
| Distribution | 3.5 | 4.5 | 5.5 |
| BTP | 3.0 | 4.0 | 5.0 |
| Restauration | 2.5 | 3.5 | 5.0 |

### Ajustements par taille

| CA | Ajustement |
|----|------------|
| < 500 K€ | -1.5 à -2.0 |
| 500K - 1M€ | -1.0 à -1.5 |
| 1M - 5M€ | -0.5 à -1.0 |
| 5M - 10M€ | Référence |
| > 10M€ | +0.5 à +1.0 |

### Ajustements par localisation

| Zone | Ajustement |
|------|------------|
| Paris intra-muros | +15 à +25% |
| IDF | +5 à +15% |
| Grandes métropoles | +5 à +10% |
| Zones rurales | -5 à -15% |

---

## 8. Barèmes Fonds de Commerce

### Par activité (% du CA)

| Activité | % min | % max | Base |
|----------|-------|-------|------|
| Boulangerie | 60% | 100% | TTC |
| Boulangerie-pâtisserie | 70% | 110% | TTC |
| Restaurant traditionnel | 50% | 120% | TTC |
| Restauration rapide | 40% | 80% | TTC |
| Café / Bar | 100% | 300% | TTC |
| Bar-tabac | 150% | 400% | * |
| Hôtel | 200% | 400% | HT |
| Coiffure | 50% | 85% | HT |
| Institut beauté | 50% | 90% | HT |
| Pharmacie | 70% | 100% | HT |
| Garage auto | 30% | 60% | HT |

*Bar-tabac : X années de remise nette tabac + % CA bar/jeux

### Ajustements

| Facteur | Impact |
|---------|--------|
| Emplacement n°1 | +20 à +50% |
| Emplacement secondaire | -10 à -30% |
| Bail avantageux | +10 à +20% |
| Bail défavorable | -10 à -20% |
| Licence IV | +10K à +100K€ |

---

## 9. Pédagogie Adaptative

### Trois niveaux

#### 🟢 FORT (Débutant)

```
Règles :
- Expliquer CHAQUE concept technique
- Analogies concrètes (maison, voiture)
- Pas de jargon sans explication
- Exemples chiffrés
- Émojis avec parcimonie
```

**Exemple EBITDA retraité :**
> L'EBITDA, c'est ce que votre entreprise génère comme "richesse" avant
> de payer les intérêts et impôts. Votre EBITDA comptable de 180K€ doit
> être ajusté car vous vous versez un salaire de 36K€, bien en dessous
> du marché (80K€). Un repreneur devra se payer plus.
> → EBITDA retraité : 136K€

#### 🟡 MOYEN (Intermédiaire)

```
Règles :
- Expliquer concepts avancés (DCF, décotes)
- Bases (CA, marge) sans explication
- Ton professionnel accessible
```

**Exemple :**
> EBITDA comptable 180K€, retraité à 136K€ après normalisation
> rémunération dirigeant (36K€ vs 80K€ normatif).

#### 🔴 EXPERT

```
Règles :
- Données brutes
- Jargon OK
- Format concis, tableaux
- Pas d'émojis
```

**Exemple :**
> EBITDA : 180K€ → Retraitement rému : -44K€ → EBITDA retraité : 136K€

---

## 10. Structure du Rapport

### Sections obligatoires

1. **PAGE DE GARDE**
2. **RÉSUMÉ EXÉCUTIF** (1-2 pages)
   - Fourchette valorisation
   - Méthodes utilisées
   - Points clés
3. **PRÉSENTATION ENTREPRISE** (2-3 pages)
4. **ANALYSE FINANCIÈRE** (4-6 pages)
   - Évolution CA, EBITDA (graphiques)
   - Ratios clés
5. **RETRAITEMENTS** (2-3 pages)
   - Détail chaque retraitement
   - EBITDA comptable → retraité
6. **ANALYSE RISQUES** (2-3 pages)
7. **VALORISATION** (4-6 pages)
   - Méthode 1 : Multiple EBITDA
   - Méthode 2 : ANC
   - (Méthode 3 : DCF)
   - Synthèse fourchette
8. **DÉCOTES** (si applicable)
9. **RECOMMANDATIONS** (2-3 pages)
10. **ANNEXES** (glossaire, calculs, sources)

---

## 11. Contrôle Qualité

### Vérifications avant rapport

- [ ] Au moins 1 an de données financières
- [ ] EBITDA disponible ou calculable
- [ ] Questions retraitements posées
- [ ] Questions risques posées
- [ ] EBITDA retraité calculé
- [ ] Au moins 2 méthodes de valorisation
- [ ] Décotes appliquées si contexte minoritaire
- [ ] Fourchette définie (pas valeur unique)

### Alertes à afficher

| Condition | Alerte |
|-----------|--------|
| EBITDA négatif | "⚠️ Approche patrimoniale privilégiée" |
| Données < 2 ans | "⚠️ Historique limité" |
| Concentration > 50% | "🔴 Risque critique dépendance client" |
| MRR -20% sur 6 mois | "🔴 Tendance défavorable" |
| Décote > 40% | "ℹ️ Décote significative" |

### Cas de test

1. **PME standard** : CA 2M€, EBITDA 200K€, Services B2B → 900K-1.2M€
2. **Dirigeant sous-payé** : Retraitement -44K€ → valo plus basse
3. **Parts minoritaires 25%** : Décotes ~35% → ~160K€ vs 250K€
4. **Fonds de commerce resto** : CA 500K€, Paris → 300-350K€
5. **Risques multiples** : Provisions à déduire

---

## 12. Règles de Conversation

### Ordre des questions

```
1. Contexte (SIREN, objectif, objet, profil)
2. Données financières manquantes
3. Retraitements (TOUJOURS)
4. Risques (TOUJOURS)
5. Décotes (si applicable)
6. Confirmation avant génération
```

### Principes

1. **CONTEXTUALISER** - Expliquer pourquoi on pose la question
2. **GROUPER** - Pas de questions une par une
3. **RÉSUMER** - Récapituler après chaque phase
4. **ADAPTER** - Vocabulaire selon niveau pédagogie
5. **RASSURER** - Proposer aide si utilisateur perdu
6. **PROGRESSER** - Indiquer où on en est dans le process

### Gestion "je ne sais pas"

- Donnée critique → proposer estimation ou fourchette
- Donnée secondaire → valeur par défaut
- Risque → hypothèse prudente

---

## Annexe A : Glossaire

| Terme | Définition |
|-------|------------|
| **EBITDA** | Bénéfice avant intérêts, impôts, amortissements |
| **EBE** | Excédent Brut d'Exploitation (≈ EBITDA français) |
| **EBITDA retraité** | EBITDA ajusté pour exploitation "normale" |
| **Multiple** | Coefficient × EBITDA = valeur entreprise |
| **EV** | Enterprise Value = valeur entreprise |
| **Equity** | Valeur des titres = EV - dettes + tréso |
| **ANC** | Actif Net Corrigé |
| **DCF** | Discounted Cash Flow |
| **Dette nette** | Dettes financières - Trésorerie |
| **Décote minoritaire** | Réduction valeur si pas de contrôle |
| **Décote illiquidité** | Réduction si titres difficiles à vendre |

---

## Annexe B : Sources

- Rapport Dealsuite / Fusac France (semestriel)
- Indice Argos Mid-Market (trimestriel)
- CCEF - Indicateurs valeur PME
- Mémento Francis Lefebvre - Évaluation
- BODACC - Transactions publiées

---

*Document EvalUp v2 - Janvier 2025*
