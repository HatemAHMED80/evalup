# Diagnostic EvalUp - Documentation technique

## Vue d'ensemble

Le diagnostic est le point d'entree de l'evaluation. L'utilisateur remplit un formulaire en 10 etapes, le systeme calcule un score financier (A-E), detecte l'archetype d'entreprise parmi 15, puis redirige vers l'evaluation complete payante.

---

## 1. Donnees collectees (formulaire 10 etapes)

| Etape | Champ | Type | Valeurs possibles | Defaut |
|-------|-------|------|-------------------|--------|
| 0 | SIREN | String (9 chiffres) | Valide via API Pappers | - |
| 1 | Type d'activite | Enum | `saas`, `marketplace`, `ecommerce`, `conseil`, `services`, `commerce`, `industrie`, `immobilier` | - |
| 2 | Chiffre d'affaires | Number | >= 0 EUR | - |
| 3 | EBITDA | Number | Tout (peut etre negatif) | - |
| 4 | Croissance | Number (slider) | -30% a +100% | 15% |
| 5 | Revenus recurrents | Number (slider) | 0-100% | 20% |
| 6 | Masse salariale / CA | Number (slider) | 0-90% | 35% |
| 7 | Effectif | Enum | `1`, `2-5`, `6-20`, `21-50`, `50+` | - |
| 8 | Patrimoine immobilier | Boolean | Oui/Non | null |
| 9 | Loyers nets annuels | Number | >= 0 EUR | null |

**Conditions :**
- Etape 8 sautee pour SaaS / Marketplace / E-commerce
- Etape 9 affichee uniquement si hasPatrimoine=true OU activityType=immobilier

**Le lookup SIREN ajoute automatiquement :**
- Nom de l'entreprise (`companyName`)
- Code NAF (`nafCode`)
- Secteur d'activite (`sector`)

---

## 2. Calcul des ratios financiers

Source : `src/lib/analyse/ratios.ts` — fonction `calculerRatios(bilan: BilanAnnuel)`

### 18 ratios calcules

#### Rentabilite
| Ratio | Formule |
|-------|---------|
| Marge brute | (CA - Achats) / CA |
| Marge EBITDA | EBITDA / CA |
| Marge EBIT | Resultat d'exploitation / CA |
| Marge nette | Resultat net / CA |
| ROE | Resultat net / Capitaux propres |

#### Structure financiere
| Ratio | Formule |
|-------|---------|
| Endettement | Dettes financieres / Capitaux propres |
| Dette nette / EBITDA | (Dettes - Tresorerie - VMP) / EBITDA |
| Autonomie financiere | Capitaux propres / Total bilan |

#### Liquidite
| Ratio | Formule |
|-------|---------|
| Liquidite generale | Actif circulant / Passif circulant |
| Tresorerie nette | Tresorerie + VMP - Passif court terme |

#### Cycle d'exploitation (BFR)
| Ratio | Formule |
|-------|---------|
| DSO (delai clients) | (Creances clients / CA) x 365 jours |
| DPO (delai fournisseurs) | (Dettes fournisseurs / Achats) x 365 jours |
| BFR / CA | BFR / CA |

#### Generation de cash
| Ratio | Formule |
|-------|---------|
| Free Cash Flow | EBITDA - Impots - Capex |
| FCF / CA | FCF / CA |
| Capex / Amortissements | Capex / Amortissements |

---

## 3. Seuils d'evaluation des ratios

Chaque ratio est note **"bon"**, **"moyen"** ou **"mauvais"** selon des seuils :

| Ratio | Bon | Moyen | Mauvais | Sens |
|-------|-----|-------|---------|------|
| Marge brute | >= 35% | >= 25% | < 25% | Plus = mieux |
| Marge EBITDA | >= 10% | >= 6% | < 6% | Plus = mieux |
| Marge nette | >= 5% | >= 2% | < 2% | Plus = mieux |
| ROE | >= 15% | >= 8% | < 8% | Plus = mieux |
| Endettement | <= 0.5x | <= 1.0x | > 1.0x | Moins = mieux |
| Dette nette / EBITDA | <= 1.5x | <= 3.0x | > 3.0x | Moins = mieux |
| Liquidite generale | >= 1.5x | >= 1.2x | < 1.2x | Plus = mieux |
| DSO | <= 45j | <= 60j | > 60j | Moins = mieux |
| DPO | >= 60j | >= 45j | < 45j | Plus = mieux |
| BFR / CA | <= 10% | <= 20% | > 20% | Moins = mieux |
| FCF / CA | >= 5% | >= 2% | < 2% | Plus = mieux |
| Capex / Amort. | >= 1.0x | >= 0.7x | < 0.7x | Plus = mieux |

**Ajustements sectoriels** : les seuils de marges sont adaptes pour transport, restaurant, SaaS, commerce, BTP, services.

---

## 4. Calcul du score et de la note (A-E)

Source : `src/lib/analyse/diagnostic.ts`

### Formule

```
score = (nb_bons x 2 + nb_moyens x 1) / (nb_total x 2) x 100
```

### Grille de notation

| Score | Note | Interpretation |
|-------|------|----------------|
| >= 80 | **A** | Excellente sante financiere |
| >= 65 | **B** | Bonne sante financiere |
| >= 50 | **C** | Sante financiere correcte |
| >= 35 | **D** | Sante financiere fragile |
| < 35 | **E** | Sante financiere critique |

### Exemple

15 ratios evalues : 8 "bon" + 4 "moyen" + 3 "mauvais"
- Score = (8x2 + 4x1) / (15x2) x 100 = 20/30 x 100 = **66.7% → Note B**

### Sortie du diagnostic

```json
{
  "noteGlobale": "B",
  "score": 67,
  "categories": [
    {
      "nom": "Rentabilite",
      "ratios": [
        { "nom": "Marge EBITDA", "valeur": 0.12, "valeurFormatee": "12%", "evaluation": "bon" }
      ]
    }
  ],
  "pointsForts": ["Marge EBITDA elevee", "Endettement maitrise"],
  "pointsVigilance": ["DSO eleve (72 jours)", "BFR / CA > 20%"]
}
```

---

## 5. Detection de l'archetype (arbre de decision)

Source : `src/lib/valuation/archetypes.ts` — fonction `detectArchetype()`

L'archetype est detecte par **6 niveaux de priorite (P1-P6)**, le premier match gagne :

### P1 — Cas critiques (verifies en premier)

| Regle | Condition | Archetype |
|-------|-----------|-----------|
| 1 | CA <= 0 OU secteur = pre_revenue/deeptech/biotech | **pre_revenue** |
| 2 | EBITDA < 0 ET croissance > 40% ET hasMRR = true | **saas_hyper** |

### P2 — Patrimoine & Micro

| Regle | Condition | Archetype |
|-------|-----------|-----------|
| 3 | Secteur = patrimoine/immobilier/holding/sci/fonciere ET recurrent > 50% | **patrimoine** |
| 4 | Secteur = patrimoine/immobilier/holding/sci/fonciere ET recurrent <= 50% | **patrimoine_dominant** |
| 5 | CA < 300 000 EUR | **micro_solo** |

### P3 — Entreprises en difficulte

| Regle | Condition | Archetype |
|-------|-----------|-----------|
| 6 | EBITDA < 0 ET croissance < 20% ET CA > 1M EUR | **deficit_structurel** |
| 7 | Masse salariale > 60% CA (sauf conseil et commerce) | **masse_salariale_lourde** |

### P4 — Tech & Digital

| Regle | Condition | Archetype |
|-------|-----------|-----------|
| 8 | hasMRR ET recurrent > 80% ET croissance > 40% | **saas_hyper** |
| 9 | hasMRR ET recurrent > 80% ET croissance >= 5% | **saas_mature** |
| 10 | hasMRR ET recurrent > 60% ET croissance < 5% | **saas_decline** |
| 10b | Secteur = saas ET hasMRR → selon croissance | saas_hyper / mature / decline |
| 11 | Secteur = marketplace | **marketplace** |
| 12 | Secteur = ecommerce / d2c | **ecommerce** |

### P5 — Secteurs traditionnels

| Regle | Condition | Archetype |
|-------|-----------|-----------|
| 13 | Secteur dans CONSEIL_KEYWORDS* | **conseil** |
| 14 | Recurrent > 60% | **services_recurrents** |
| 15 | hasPhysicalStore OU secteur dans COMMERCE_KEYWORDS** | **commerce_retail** |
| 16 | Secteur dans INDUSTRIE_KEYWORDS*** | **industrie** |
| 17 | Secteur = services | **services_recurrents** |

### P6 — Fallback

| Regle | Condition | Archetype |
|-------|-----------|-----------|
| 18 | Aucun match | **conseil** (defaut) |

**Mots-cles sectoriels :**

\* CONSEIL_KEYWORDS : conseil, consulting, esn, expert-comptable, comptable, avocat, architecte, communication, formation, audit, agence immobiliere, agence web, bureau d'etudes

\** COMMERCE_KEYWORDS : commerce, retail, restaurant, boulangerie, pharmacie, coiffeur, esthetique, garage, fleuriste, opticien, caviste, veterinaire, auto-ecole, hotel, hebergement, location, luxe, bar, cafe, pressing, tabac

\*** INDUSTRIE_KEYWORDS : industrie, manufacturing, btp, transport, logistique, agroalimentaire, imprimerie, menuiserie, extraction, carriere, mine, usine, metallurgie, chimie, plasturgie, textile, energie

**Variables derivees :**
- `hasMRR` = true si activityType est `saas` ou `marketplace`
- `hasPhysicalStore` = true si activityType est `commerce` ou `industrie`

---

## 6. Les 15 archetypes — methodes et multiples

| # | ID | Nom | Methode principale | Multiple | Methode secondaire |
|---|----|----|---------------------|----------|---------------------|
| 1 | saas_hyper | SaaS Hyper-croissance | Multiple d'ARR | 8x-25x | Rule of 40 |
| 2 | saas_mature | SaaS Mature | Multiple EBITDA + validation ARR | 10x-20x (EBITDA) / 4x-10x (ARR) | DCF 5 ans |
| 3 | saas_decline | SaaS en declin | Multiple EBITDA avec decote | 4x-8x | DCF pessimiste |
| 4 | marketplace | Marketplace | Multiple CA net (60%) + GMV (40%) | 5x-15x (CA) / 1x-4x (GMV) | Comparables |
| 5 | ecommerce | E-commerce / D2C | CA ou EBITDA selon marge | 1x-3x (CA) ou 6x-12x (EBITDA) | DCF + marque |
| 6 | conseil | Conseil | EBITDA retraite (70%) + CA (30%) | 4x-8x (EBITDA) / 0.5x-1.5x (CA) | Homme-cle |
| 7 | services_recurrents | Services recurrents | EBITDA (70%) + CA recurrent (30%) | 5x-10x (EBITDA) / 2x-4x (CA) | Base clients |
| 8 | commerce_retail | Commerce physique | EBITDA + fonds de commerce | 3x-6x | ANR fonds |
| 9 | industrie | Industrie | EBITDA (70%) + ANR (30%) | 4x-7x | Actifs corporels |
| 10 | patrimoine | Societe patrimoniale | ANR (reevaluation actifs) | Actifs - Dettes | Rendement locatif |
| 11 | patrimoine_dominant | Patrimoine dominant | ANR avec decote | Actifs - Dettes (-15 a -40%) | Valeur d'usage |
| 12 | deficit_structurel | Deficit structurel | Multiple CA avec decote | 0.3x-1.5x | Valeur de liquidation |
| 13 | masse_salariale_lourde | Masse salariale lourde | EBITDA prudent | 3x-5x | Multiple CA 0.5x-1.5x |
| 14 | micro_solo | Micro-entreprise | Multiple du benefice | 1x-3x | Bareme fiscal |
| 15 | pre_revenue | Pre-revenue / Deep Tech | DCF business plan | N/A | Methode VC / Berkus |

**Decote France** : -25% appliquee aux multiples Damodaran US (fourchette -20% a -30%).

---

## 7. Donnees transmises a l'evaluation

Apres le diagnostic, les donnees sont stockees dans `sessionStorage['diagnostic_result']` :

```json
{
  "archetypeId": "saas_mature",
  "archetype": { "id": "saas_mature", "name": "SaaS Mature", "icon": "...", ... },
  "multiples": {
    "primaryMultiple": { "metric": "EBITDA", "low": 10, "median": 15, "high": 20 },
    "secondaryMultiple": { "metric": "ARR", "low": 4, "median": 7, "high": 10 },
    "damodaranSector": "Software (System & Application)"
  },
  "input": {
    "activityType": "saas",
    "revenue": 2000000,
    "ebitda": 400000,
    "growth": 25,
    "recurring": 95,
    "masseSalariale": 30,
    "effectif": "21-50",
    "hasPatrimoine": false,
    "loyersNets": null
  }
}
```

En base de donnees (table `evaluations`) :
- `archetype_id` : ID de l'archetype detecte
- `diagnostic_data` : Objet JSON avec toutes les donnees du formulaire

Dans le contexte de conversation (`ConversationContext`) :
- `context.archetype` : ID de l'archetype → determine le prompt systeme et les questions de l'IA
- `context.diagnosticData` : revenue, ebitda, growth, recurring, masseSalariale, effectif
- `context.isPaid` : true (post-paiement)

---

## 8. Fichiers sources

| Fichier | Role |
|---------|------|
| `src/components/diagnostic/DiagnosticForm.tsx` | Formulaire 10 etapes |
| `src/app/diagnostic/page.tsx` | Page diagnostic |
| `src/app/diagnostic/result/page.tsx` | Page resultat |
| `src/app/diagnostic/signup/page.tsx` | Redirection inscription |
| `src/lib/analyse/diagnostic.ts` | Moteur de diagnostic (score A-E) |
| `src/lib/analyse/ratios.ts` | Calcul des 18 ratios + seuils |
| `src/lib/valuation/archetypes.ts` | 15 archetypes + detection |
| `src/lib/prompts/archetype-prompts/*.ts` | 15 fichiers de prompts specifiques |
| `src/lib/prompts/builder.ts` | Assemblage du prompt systeme |
