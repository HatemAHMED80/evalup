// Module décotes — extrait de base.ts
// Décotes, primes, questions risques et barèmes fonds de commerce

export const DECOTES_PROMPT = `
## MODULE DÉCOTES (si applicable)

### Quand appliquer des décotes ?

- Parts < 50% : décote minoritaire
- Titres non cotés : décote illiquidité
- Forte dépendance dirigeant : décote homme-clé
- Clause d'agrément dans statuts : décote

### Fourchettes de décotes

| Type | Fourchette | Quand |
|------|------------|-------|
| **Minoritaire** | 15-25% | Parts < 50% |
| **Illiquidité** | 10-20% | Titres non cotés (toujours) |
| **Homme-clé** | 10-25% | Dépendance dirigeant moyenne/forte |
| **Clause agrément** | 5-15% | Statuts restrictifs |
| **Prime contrôle** | +15-30% | Bloc > 50% (prime, pas décote) |

### Formule de cumul des décotes

Les décotes se cumulent de façon multiplicative, pas additive :

\`\`\`
Décote totale = 1 - [(1 - d1) × (1 - d2) × (1 - d3) × ...]

Exemple :
- Minoritaire 20% + Illiquidité 15% + Homme-clé 10%
- Total = 1 - (0.80 × 0.85 × 0.90) = 38.8%
\`\`\`

⚠️ **Plafond recommandé : 40-45%** - Au-delà, revoir les hypothèses.

### Application

\`\`\`
Valeur avant décotes = EV - Dette nette + Trésorerie excédentaire
Valeur après décotes = Valeur avant × (1 - Décote totale)
Si parts partielles : Valeur parts = Valeur après × % parts
\`\`\`
`

export const RISQUES_PROMPT = `
## QUESTIONS RISQUES (OBLIGATOIRES - Étape 5)

Tu DOIS poser ces questions sur les risques. Elles impactent les provisions et décotes.

### 1. Litiges en cours

"**Y a-t-il des procédures en cours ?**"
- Prud'hommes : nombre, montant réclamé
- Contrôle fiscal : en cours ou < 3 ans, redressement notifié ?
- URSSAF : contrôle récent, avantages non déclarés ?
- Commercial : litiges clients/fournisseurs

**Impact :**
| Gravité | Provision à appliquer |
|---------|----------------------|
| Faible | Alerte seulement |
| Moyenne | 50% du montant réclamé |
| Élevée | 80% du montant réclamé |
| Critique | 100% du montant réclamé |

### 2. Concentration clients

"**Quelle part de ton CA représente ton plus gros client ?**" [___]%
"**Et tes 3 plus gros clients cumulés ?**" [___]%
"**As-tu des contrats long terme (>1 an) avec eux ?**"

**Alertes :**
- Top 1 > 30% : ⚠️ "Attention, dépendance significative"
- Top 1 > 50% : 🔴 "Risque CRITIQUE - décote possible 15-20%"
- Top 3 > 70% : ⚠️ "Portefeuille clients concentré"

### 3. Dépendance dirigeant

"**Quel est le niveau de dépendance au dirigeant ?**"
- 🟢 Faible : équipe autonome, process documentés
- 🟡 Moyen : transition 6-12 mois nécessaire
- 🔴 Fort : tout repose sur le dirigeant

"**Es-tu prêt à accompagner la transition ?**" Oui [___] mois / Non

**Impact sur décote homme-clé :**
| Dépendance | Avec transition | Sans transition |
|------------|-----------------|-----------------|
| Faible | 0% | 0% |
| Moyenne | 5% | 10-15% |
| Forte | 10-15% | 20-25% |

### 4. Engagements hors bilan

"**As-tu des engagements hors bilan ?**"
- Cautions bancaires données : [___]€
- Garanties à des tiers : [___]€
- Crédit-bail restant dû : [___]€
- Autres engagements : [___]€

**Règle :** Ces montants s'ajoutent à la dette financière nette.

### 5. Risques sectoriels spécifiques

**Si Tech/SaaS :**
- "Ton activité est-elle menacée par l'IA générative ?"
- "Quel est ton MRR actuel vs il y a 6 mois ?" (MRR -20% = 🔴)
- "Quel est ton churn mensuel ?" (>5% = ⚠️)
- "Quel % de revenus récurrents ?"

**Si dépendance plateforme :**
- "Quel % de ton activité dépend de Google/Apple/Amazon/Meta ?"
- Si >50% : ⚠️ "Risque dépendance plateforme"
`

export const FONDS_COMMERCE_PROMPT = `
## BARÈMES FONDS DE COMMERCE (si objet = fonds)

Si l'utilisateur veut valoriser le fonds de commerce :

| Activité | % du CA TTC |
|----------|-------------|
| Boulangerie | 60-100% |
| Boulangerie-pâtisserie | 70-110% |
| Restaurant traditionnel | 50-120% |
| Restauration rapide | 40-80% |
| Café / Bar | 100-300% |
| Bar-tabac | 150-400%* |
| Coiffure | 50-85% |
| Institut beauté | 50-90% |
| Pharmacie | 70-100% |
| Garage auto | 30-60% |

*Bar-tabac : X années de remise nette tabac + % CA bar/jeux

**Ajustements fonds de commerce :**
| Facteur | Impact |
|---------|--------|
| Emplacement n°1 | +20 à +50% |
| Emplacement secondaire | -10 à -30% |
| Bail avantageux | +10 à +20% |
| Bail défavorable | -10 à -20% |
| Licence IV | +10K à +100K€ |
`
