// Module retraitements EBITDA — extrait de base.ts
// Questions obligatoires pour normaliser l'EBITDA et calculer la VE

export const RETRAITEMENTS_PROMPT = `
### Questions de retraitement EBITDA (OBLIGATOIRES)

Pour normaliser l'EBITDA et calculer une VE juste, tu DOIS poser ces questions au cours de l'évaluation :

**1. Rémunération dirigeant** (Étape 4)
- "Quel est ton salaire annuel brut chargé (y compris cotisations patronales) ?"
- But : Comparer au salaire marché pour un dirigeant salarié équivalent
- Si trop bas → on déduit le manque à gagner de l'EBITDA
- Si trop haut → on réintègre l'excédent dans l'EBITDA

**2. Loyer des locaux** (Étape 3)
- "Les locaux appartiennent-ils à une SCI ou à toi personnellement ?"
- Si oui : "Quel est le loyer annuel payé par l'entreprise ?"
- Si oui : "Quelle serait la valeur locative marché de ces locaux ?"
- But : Ajuster si le loyer est sur/sous-évalué

**3. Crédit-bail** (Étape 3)
- "As-tu des véhicules ou équipements en crédit-bail (leasing) ?"
- Si oui : "Quel est le montant annuel des loyers de crédit-bail ?"
- Si oui : "Quel est le capital restant dû sur ces contrats ?"
- But : Les loyers de crédit-bail sont réintégrés à l'EBITDA, le capital restant ajouté aux dettes

**4. Éléments exceptionnels** (Étape 2)
- "Y a-t-il eu des charges exceptionnelles non récurrentes ces dernières années ?"
  (litiges, sinistres, restructuration, etc.)
- "Y a-t-il eu des produits exceptionnels non récurrents ?"
  (plus-values, indemnités, subventions one-shot, etc.)
- But : Neutraliser les éléments non récurrents

**5. Employés famille** (Étape 4)
- "Y a-t-il des membres de ta famille employés dans l'entreprise ?"
- Si oui : "Leur rémunération est-elle en ligne avec le marché pour leur poste ?"
- But : Ajuster les salaires excessifs ou insuffisants

**6. Compte courant associé** (Étape 3)
- "As-tu un compte courant d'associé ? Si oui, quel montant ?"
- "Ce compte courant devra-t-il être remboursé à la cession ?"
- But : Ajouter aux dettes si remboursable

### Questions dette financière (OBLIGATOIRES)

**À poser systématiquement** (Étape 3) :
- "As-tu des emprunts bancaires en cours ? Si oui, quel capital restant dû ?"
- "Quelle est ta trésorerie disponible actuellement ?"
- "As-tu des engagements de retraite (IFC) non provisionnés ?"
- "Y a-t-il de la participation aux salariés à verser ?"

### Formule EBITDA Normalisé

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
`
