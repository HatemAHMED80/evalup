# Algorithme d'Analyse EvalUp

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                    RECHERCHE ENTREPRISE                         │
│                     (SIREN ou SIRET)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CHARGEMENT DONNÉES PUBLIQUES                   │
│              (API Pappers + données financières)                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CHOIX DU PARCOURS                            │
│                                                                 │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│   │ DIRIGEANT│  │  CÉDANT  │  │ REPRENEUR│  │ CONSEIL  │       │
│   │    📊    │  │    🏢    │  │    🔍    │  │    📈    │       │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 QUESTION DOCUMENTS                              │
│        "Avez-vous des documents à partager ?"                   │
│                                                                 │
│            ┌─────────┐        ┌─────────────────┐               │
│            │   OUI   │        │ NON, continuons │               │
│            └─────────┘        └─────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
                    │                    │
                    ▼                    ▼
           ┌───────────────┐    ┌───────────────────┐
           │  UPLOAD DOCS  │    │ QUESTIONNAIRE     │
           │  (📎 trombone)│    │ (adapté parcours) │
           └───────────────┘    └───────────────────┘
                    │                    │
                    └────────┬───────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ANALYSE & RAPPORT                            │
│               (30 pages PDF personnalisé)                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Les 4 Parcours Utilisateur

### 1.1 DIRIGEANT 📊
> "C'est mon entreprise - Je veux comprendre mes finances"

**Profil cible :** Dirigeant de PME qui ne maîtrise pas le jargon comptable

**Ton adopté :**
- Chaleureux, patient, vulgarisateur
- Analogies concrètes ("Votre trésorerie couvre X mois de charges")
- Rassurer si positif, alerter sans paniquer si négatif

**Focus de l'analyse :**
- Santé financière globale
- Trésorerie et BFR
- Rentabilité
- Points d'amélioration concrets

---

### 1.2 CÉDANT 🏢
> "C'est mon entreprise - Je veux faire une évaluation"

**Profil cible :** Dirigeant qui envisage de vendre sa société

**Ton adopté :**
- Expert, stratégique, orienté action
- Direct mais bienveillant
- Honnête sur les points faibles

**Focus de l'analyse :**
- Valorisation multi-méthodes
- Leviers pour augmenter la valeur avant cession
- Points forts à mettre en avant
- Timing optimal de cession

---

### 1.3 REPRENEUR 🔍
> "Ce n'est pas mon entreprise - Je veux faire une évaluation"

**Profil cible :** Acquéreur potentiel en due diligence

**Ton adopté :**
- Analytique, prudent, orienté risques
- Critique et objectif
- Protecteur des intérêts de l'acheteur

**Focus de l'analyse :**
- Due diligence financière
- TOUS les risques et points de vigilance
- Arguments de négociation
- Dépendance au dirigeant actuel

---

### 1.4 CONSEIL 📈
> "Ce n'est pas mon entreprise - Je veux analyser ces finances"

**Profil cible :** Expert-comptable, conseiller M&A, banquier, investisseur

**Ton adopté :**
- Concis, technique, factuel
- Efficace, va droit au but
- Pas de pédagogie, données brutes

**Focus de l'analyse :**
- Ratios financiers clés
- Valorisation multi-méthodes
- Benchmark sectoriel
- Données exportables

---

## 2. Flux Documents

### 2.1 Réponse "OUI, j'ai des documents"

```
Utilisateur: "Oui, j'ai des documents"
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  "Parfait ! 📎 Cliquez sur le trombone en bas à gauche         │
│   du chat pour ajouter vos documents."                          │
│                                                                 │
│  [CONTEXT]                                                      │
│  Je vais analyser vos documents pour en extraire les données    │
│  clés : CA, résultat net, EBITDA, trésorerie, dettes...        │
│  [/CONTEXT]                                                     │
│                                                                 │
│  [QUESTION] Une fois vos documents ajoutés, envoyez-les moi !   │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────────────────────────��┐
│                   UPLOAD DE DOCUMENTS                           │
│                                                                 │
│  Formats acceptés:                                              │
│  • PDF (bilan, compte de résultat, liasse fiscale)             │
│  • Excel/CSV (suivi trésorerie, tableaux de bord)              │
│  • Images (factures, relevés)                                   │
│                                                                 │
│  Traitement:                                                    │
│  ┌──────────────┐     ┌──────────────┐                         │
│  │ PDF Texte    │     │ PDF Scanné   │                         │
│  │ (extractible)│     │ (image)      │                         │
│  └──────┬───────┘     └──────┬───────┘                         │
│         │                    │                                  │
│         ▼                    ▼                                  │
│  ┌──────────────┐     ┌──────────────┐                         │
│  │  pdf-parse   │     │ Claude Vision│                         │
│  │  (gratuit)   │     │ (~0.08€/doc) │                         │
│  └──────────────┘     └──────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│              EXTRACTION AUTOMATIQUE                             │
│                                                                 │
│  Données extraites:                                             │
│  • Type de document (bilan, CR, liasse...)                     │
│  • Année                                                        │
│  • CA, Résultat Net, EBITDA                                    │
│  • Trésorerie, Dettes, Capitaux propres                        │
│  • Anomalies détectées                                          │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Réponse "NON, continuons sans"

Le questionnaire s'adapte au parcours choisi :

#### DIRIGEANT (sans documents)
```
"Pas de souci ! Je vais vous poser quelques questions pour
mieux comprendre votre entreprise et constituer votre
**analyse financière personnalisée**."

[QUESTION] Commençons : quelle est votre activité principale
et depuis combien de temps exercez-vous ?
```

#### CÉDANT (sans documents)
```
"Pas de souci ! Je vais vous poser quelques questions pour
mieux comprendre votre entreprise et constituer votre
**évaluation de cession**."

[QUESTION] Commençons : quelle est votre activité principale
et depuis combien de temps dirigez-vous cette entreprise ?
```

#### REPRENEUR (sans documents)
```
"Pas de souci ! Je vais vous poser quelques questions pour
analyser cette cible et constituer votre **rapport d'acquisition**."

[QUESTION] Commençons : que savez-vous de l'activité de cette
entreprise et qu'est-ce qui vous intéresse dans cette acquisition ?
```

#### CONSEIL (sans documents)
```
"Entendu. Je vais collecter les informations nécessaires pour
constituer l'**analyse professionnelle**."

[QUESTION] Quel est le contexte de cette analyse ?
(Due diligence, valorisation, audit, autre)
```

### 2.3 Changement d'avis (OUI → NON)

Si l'utilisateur dit d'abord "oui" puis change d'avis :
- "Finalement non..."
- "Je n'ai pas de documents"
- "Aucun document"

→ Le système redirige vers le questionnaire adapté au parcours.

---

## 3. Questions par Parcours et Étape

### Étape 1 : Activité

| Parcours | Question |
|----------|----------|
| DIRIGEANT | Quelle est votre activité principale et depuis combien de temps exercez-vous ? |
| CÉDANT | Quelle est votre activité principale et depuis combien de temps dirigez-vous cette entreprise ? |
| REPRENEUR | Que savez-vous de l'activité de cette entreprise et qu'est-ce qui vous intéresse ? |
| CONSEIL | Quel est le contexte de cette analyse ? (Due diligence, valorisation, audit, autre) |

### Étape 2 : Finances (si pas de documents)

| Parcours | Questions |
|----------|-----------|
| DIRIGEANT | Quel est approximativement votre CA annuel ? Êtes-vous rentable ? |
| CÉDANT | Quel est votre CA et résultat net des 3 dernières années ? |
| REPRENEUR | Avez-vous accès au prix demandé ? Aux derniers comptes publiés ? |
| CONSEIL | Quelles données financières avez-vous à disposition ? |

### Étape 3 : Marché

| Parcours | Questions |
|----------|-----------|
| DIRIGEANT | Comment se porte votre marché ? Vos principaux concurrents ? |
| CÉDANT | Quelle est votre position concurrentielle ? Vos avantages ? |
| REPRENEUR | Connaissez-vous le positionnement de cette entreprise ? Ses concurrents ? |
| CONSEIL | Quel est le contexte sectoriel ? Tendances du marché ? |

### Étape 4 : Risques

| Parcours | Questions |
|----------|-----------|
| DIRIGEANT | Quels sont vos principaux défis actuels ? Points de vigilance ? |
| CÉDANT | Y a-t-il des litiges en cours ? Dépendance clients/fournisseurs ? |
| REPRENEUR | Quels risques avez-vous identifiés ? Dépendance au dirigeant ? |
| CONSEIL | Points de vigilance identifiés ? Risques spécifiques au secteur ? |

### Étape 5 : Valorisation

| Parcours | Focus |
|----------|-------|
| DIRIGEANT | Explication pédagogique de la valeur, comparaison sectorielle |
| CÉDANT | Multi-méthodes (DCF, comparables, patrimoine), prix de cession recommandé |
| REPRENEUR | Valorisation critique, arguments de négociation, prix maximum recommandé |
| CONSEIL | Données techniques, ratios, multiples sectoriels, benchmark |

### Étape 6 : Synthèse & Rapport

| Parcours | Contenu du rapport |
|----------|-------------------|
| DIRIGEANT | Résumé vulgarisé, recommandations actionnables, points d'amélioration |
| CÉDANT | Valorisation argumentée, leviers de valeur, préparation à la vente |
| REPRENEUR | Due diligence complète, risques, négociation, recommandation go/no-go |
| CONSEIL | Analyse technique complète, ratios, valorisation, données exportables |

---

## 4. Matrice de Décision

### 4.1 Avec Documents

```
┌─────────────────┬─────────────────────────────────────────────────┐
│   PARCOURS      │              TRAITEMENT                         │
├─────────────────┼─────────────────────────────────────────────────┤
│ DIRIGEANT       │ Extraction → Explication pédagogique           │
│                 │ Focus: "Votre trésorerie couvre X mois"        │
├─────────────────┼─────────────────────────────────────────────────┤
│ CÉDANT          │ Extraction → Valorisation multi-méthodes       │
│                 │ Focus: "Pour maximiser votre prix de vente..." │
├─────────────────┼─────────────────────────────────────────────────┤
│ REPRENEUR       │ Extraction → Analyse critique des risques      │
│                 │ Focus: "Points de vigilance identifiés..."     │
├─────────────────┼─────────────────────────────────────────────────┤
│ CONSEIL         │ Extraction → Ratios et données brutes          │
│                 │ Focus: "Données financières clés..."           │
└─────────────────┴─────────────────────────────────────────────────┘
```

### 4.2 Sans Documents

```
┌─────────────────┬─────────────────────────────────────────────────┐
│   PARCOURS      │              QUESTIONNAIRE                      │
├─────────────────┼─────────────────────────────────────────────────┤
│ DIRIGEANT       │ 5-7 questions simples, ton rassurant           │
│                 │ Estimation CA basée sur activité               │
├─────────────────┼─────────────────────────────────────────────────┤
│ CÉDANT          │ Questions ciblées sur la valeur                │
│                 │ Historique 3 ans, dépendances, litiges         │
├─────────────────┼─────────────────────────────────────────────────┤
│ REPRENEUR       │ Questions d'investigation                      │
│                 │ Prix demandé, motivations vendeur, risques     │
├─────────────────┼─────────────────────────────────────────────────┤
│ CONSEIL         │ Questions techniques directes                  │
│                 │ Contexte mission, données disponibles          │
└─────────────────┴─────────────────────────────────────────────────┘
```

### 4.3 Documents + Questions complémentaires

Même avec documents, des questions contextuelles peuvent être posées :

```
┌─────────────────┬─────────────────────────────────────────────────┐
│   PARCOURS      │         QUESTIONS COMPLÉMENTAIRES               │
├─────────────────┼─────────────────────────────────────────────────┤
│ DIRIGEANT       │ "Je vois que votre trésorerie a baissé de 30%. │
│                 │  Y a-t-il eu un investissement particulier ?"  │
├─────────────────┼─────────────────────────────────────────────────┤
│ CÉDANT          │ "Votre CA est stable. Avez-vous des projets    │
│                 │  de croissance non encore réalisés ?"          │
├─────────────────┼─────────────────────────────────────────────────┤
│ REPRENEUR       │ "Le résultat dépend fortement du dirigeant.    │
│                 │  Connaissez-vous son implication opérationnelle?"│
├─────────────────┼─────────────────────────────────────────────────┤
│ CONSEIL         │ "Données 2022 uniquement. Avez-vous accès      │
│                 │  à des projections ou au budget 2024 ?"        │
└─────────────────┴─────────────────────────────────────────────────┘
```

---

## 5. Détection des Anomalies

### Types d'anomalies détectées automatiquement

| Type | Exemple | Action |
|------|---------|--------|
| **ALERTE** | Trésorerie négative | Poser question immédiate |
| **QUESTION** | Variation CA > 20% | Demander explication |
| **INFO** | Données anciennes | Mentionner dans le rapport |

### Adaptation par parcours

```
Anomalie: "Résultat net négatif 2 années consécutives"

DIRIGEANT: "Je remarque que les deux dernières années ont été
           difficiles. C'est courant dans votre secteur.
           Qu'est-ce qui explique cette situation ?"

CÉDANT:    "Point de vigilance : deux exercices déficitaires
           consécutifs. Un acquéreur potentiel questionnera
           ce point. Comment comptez-vous l'expliquer ?"

REPRENEUR: "⚠️ ALERTE : Pertes 2 années consécutives.
           Investiguer les causes. Risque de passif caché
           ou de dettes fiscales. Demander les détails."

CONSEIL:   "Résultat net N: -45K€, N-1: -23K€.
           Tendance défavorable. REX positif suggère
           charges exceptionnelles ou financières élevées."
```

---

## 6. Livrables par Parcours

### Rapport PDF 30 pages

| Section | DIRIGEANT | CÉDANT | REPRENEUR | CONSEIL |
|---------|-----------|--------|-----------|---------|
| Résumé exécutif | Vulgarisé | Stratégique | Critique | Technique |
| Données financières | Graphiques simples | Tableaux détaillés | Comparatifs | Données brutes |
| Analyse | Points forts/faibles | Attractivité | Risques | Ratios |
| Valorisation | Fourchette simple | Multi-méthodes | Prix max recommandé | Benchmark |
| Recommandations | Actions concrètes | Préparation vente | Go/No-go | Synthèse |

---

## 7. Persistance des Données

### Stockées dans localStorage
- SIREN de l'entreprise
- Parcours sélectionné
- Messages de conversation
- Documents uploadés (métadonnées)
- Étape actuelle (1-6)

### Stockées en URL
- `?parcours=cedant` → Permet de partager/bookmarker

### Stockées côté serveur (Redis)
- Session d'analyse
- Documents analysés
- Cache des réponses

---

## 8. Résumé des Flux

```
                    ┌────────────────────┐
                    │   Entrée SIREN     │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │  Choix Parcours    │
                    │  (4 options)       │
                    └─────────┬──────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
    ┌─────────▼─────┐ ┌───────▼───────┐ ┌─────▼─────────┐
    │  Documents ?  │ │  Documents ?  │ │  Documents ?  │
    │     OUI       │ │     NON       │ │   OUI→NON     │
    └───────┬───────┘ └───────┬───────┘ └───────┬───────┘
            │                 │                 │
    ┌───────▼───────┐ ┌───────▼───────┐         │
    │    Upload     │ │ Questionnaire │◄────────┘
    │   + Analyse   │ │   adapté      │
    └───────┬───────┘ └───────┬───────┘
            │                 │
            └────────┬────────┘
                     │
           ┌─────────▼─────────┐
           │ Questions contexte│
           │ (si nécessaire)   │
           └─────────┬─────────┘
                     │
           ┌─────────▼─────────┐
           │    Valorisation   │
           │ (adaptée parcours)│
           └─────────┬─────────┘
                     │
           ┌─────────▼─────────┐
           │   Rapport PDF     │
           │    30 pages       │
           └───────────────────┘
```
