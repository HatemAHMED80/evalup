// Prompt d'evaluation finale — format de sortie pour la synthese

export const EVALUATION_FINALE_PROMPT = `
Tu dois maintenant produire l'évaluation finale de l'entreprise.

## RÈGLES CRITIQUES

1. **JAMAIS d'évaluation à 0€** - Tu dois TOUJOURS calculer une estimation même avec des données partielles
2. **TOUJOURS calculer la Valeur d'Entreprise AVANT le Prix de Cession**
3. **TOUJOURS appliquer le Bridge : Prix = VE - Dette Nette**
4. **TOUJOURS donner une fourchette** (basse/moyenne/haute)
5. **TOUJOURS comparer aux benchmarks du secteur**
6. **TOUJOURS détailler les calculs étape par étape**

## Format attendu (en markdown)

### 📊 Synthèse de ton activité

| Élément | Ta valeur | Benchmark secteur |
|---------|-----------|-------------------|
| CA annuel | XXX XXX € | - |
| EBITDA comptable | XX XXX € | - |
| Marge EBITDA | X.X% | X - X% |
| Marge nette | X.X% | X - X% |
| Ratio dette/EBITDA | X.Xx | < 3x |

### 📐 EBITDA Normalisé (retraitements)

\`\`\`
EBITDA comptable :                    XX XXX €

Retraitements appliqués :
+ Rémunération dirigeant excessive :  +XX XXX €
  (salaire actuel XXk€ vs normatif XXk€)
- Loyer sous-évalué :                 -X XXX €
  (loyer actuel XXk€ vs marché XXk€)
+ Charges exceptionnelles :           +XX XXX €
  (litige 2023 - non récurrent)
+ Réintégration crédit-bail :         +XX XXX €
  (traité comme dette financière)
                                      ─────────
EBITDA Normalisé :                    XX XXX €
\`\`\`

### 📐 Méthode d'évaluation utilisée

**Pourquoi cette méthode ?**
Explique en 2-3 phrases pourquoi tu utilises cette méthode pour ce secteur.

### 🧮 Calcul de la Valeur d'Entreprise

\`\`\`
EBITDA Normalisé :                    XX XXX €
Multiple sectoriel :                  X.Xx à X.Xx

Valeur d'Entreprise :
• Hypothèse basse (X.Xx) :            XXX XXX €
• Hypothèse moyenne :                 XXX XXX €
• Hypothèse haute (X.Xx) :            XXX XXX €
\`\`\`

### 💰 Calcul de la Dette Financière Nette

\`\`\`
Dettes financières :
+ Emprunts bancaires :                XX XXX €
+ Capital crédit-bail restant :       XX XXX €
+ Compte courant à rembourser :       XX XXX €
= Total dettes :                      XX XXX €

Trésorerie :
- Disponibilités :                    -XX XXX €
- VMP :                               -XX XXX €
= Total trésorerie :                  -XX XXX €
                                      ─────────
Dette Financière Nette :              XX XXX €
\`\`\`

### 🌉 Bridge : De la VE au Prix de Cession

| Composante | Montant |
|------------|---------|
| Valeur d'Entreprise (moyenne) | XXX XXX € |
| - Dette Financière Nette | -XX XXX € |
| **= Prix de Cession** | **XXX XXX €** |

### 🎯 Fourchette de valorisation finale

| | Basse | Moyenne | Haute |
|--|-------|---------|-------|
| **Valeur d'Entreprise** | XXX XXX € | XXX XXX € | XXX XXX € |
| **Prix de Cession** | **XXX XXX €** | **XXX XXX €** | **XXX XXX €** |

_Le Prix de Cession est ce que l'acheteur paiera réellement. Il correspond à la Valeur d'Entreprise moins la dette financière nette._

### 📈 Comparaison sectorielle

| Indicateur | Ta valeur | Moyenne secteur | Position |
|------------|-----------|-----------------|----------|
| Multiple CA | X.Xx | X.X - X.Xx | ✅ Dans la norme / ⚠️ En dessous / 🌟 Au-dessus |
| Marge EBITDA | X% | X - X% | ... |
| Croissance | +X% | +X% | ... |

### ✅ Ce qui fait monter la valeur
- Point fort 1 avec explication
- Point fort 2 avec explication
- Point fort 3 avec explication

### ⚠️ Ce qui peut faire baisser la valeur
- Point de vigilance 1 avec explication
- Point de vigilance 2 avec explication

### 💡 Recommandations avant cession

1. **Action 1** : Description et impact attendu (+X€ ou +X%)
2. **Action 2** : Description et impact attendu
3. **Action 3** : Description et impact attendu

### 📋 Prochaines étapes

1. Valider cette évaluation avec ton expert-comptable
2. Préparer ta data room (3 derniers bilans, bail, contrats)
3. Télécharger le rapport PDF complet

---
💡 **Tu veux télécharger le rapport PDF complet avec tous ces détails ?**

**IMPORTANT : Quand tu donnes l'évaluation finale complète, ajoute ce marqueur à la FIN de ton message :**
[EVALUATION_COMPLETE]
Ce marqueur permet au système de savoir que l'évaluation complète est terminée.
`
