# Backup pré-migration — Modèle Archétypes

**Date :** 10 février 2026
**Raison :** Copie de sécurité avant la migration vers le modèle archétypes (voir `/docs/MIGRATION-PLAN.md`)

---

## Contenu

**59 fichiers** copiés depuis `src/`, structure de répertoires préservée.

### Fichiers SUPPRIMÉS par la migration (14)

| Fichier | Raison |
|---------|--------|
| `src/lib/prompts/flash.ts` | Le Flash devient un formulaire statique, plus un chat IA |
| `src/lib/prompts/secteurs/commerce.ts` | Absorbé dans les prompts archétype |
| `src/lib/prompts/secteurs/restaurant.ts` | Absorbé dans les prompts archétype |
| `src/lib/prompts/secteurs/saas.ts` | Absorbé dans les prompts archétype |
| `src/lib/prompts/secteurs/services.ts` | Absorbé dans les prompts archétype |
| `src/lib/prompts/secteurs/transport.ts` | Absorbé dans les prompts archétype |
| `src/lib/evaluation/calculateur.ts` | V1 legacy, remplacé par logique archétype |
| `src/lib/evaluation/secteurs/*.ts` (11 fichiers) | 15 secteurs remplacés par 15 archétypes |
| `src/app/app/page.tsx` | Dashboard SIREN supprimé, intégré au flow /diagnostic |

### Fichiers RÉÉCRITS par la migration (8)

| Fichier | Changement |
|---------|------------|
| `src/lib/prompts/base.ts` | 1 prompt base (620 lignes) → 15 prompts archétype |
| `src/lib/prompts/index.ts` | Orchestrateur réécrit pour le routing archétype |
| `src/lib/evaluation/calculateur-v2.ts` | Pondération par archétype au lieu de fixe 60/25/15 |
| `src/lib/evaluation/types.ts` | Nouveaux types archétype |
| `src/lib/pdf/assemble-report-data.ts` | Données adaptées à l'archétype |
| `src/lib/pdf/generate-qualitative.ts` | SWOT/risques par archétype |
| `src/app/page.tsx` | Nouvelle landing "diagnostic" au lieu de "estimation" |
| `src/app/tarifs/page.tsx` | 2 offres au lieu de 4 |

### Fichiers ADAPTÉS par la migration (37)

| Catégorie | Fichiers | Changement |
|-----------|----------|------------|
| Prompts | `parcours.ts` | Module complémentaire, injection dans prompts archétype |
| Evaluation | `ebitda-normalise.ts`, `dette-nette.ts`, `index.ts` | Appliqués uniquement aux archétypes EBITDA-based |
| PDF (11 fichiers) | `generator.tsx`, `professional-report-*.tsx`, etc. | Contenu adapté à l'archétype détecté |
| API routes | `chat/route.ts`, `quick-valuation/route.ts`, `pdf/route.ts` | Injection prompt archétype |
| AI module | `router.ts`, `anomalies.ts`, `ratios.ts` | Routing et analyse par archétype |
| Analyse | `anomalies.ts`, `ratios.ts`, `diagnostic.ts` | Benchmarks par archétype |
| Core | `anthropic.ts` | ConversationContext évolue |
| Chat components (7) | `ChatInterface.tsx`, `FlashValuationDisplay.tsx`, etc. | Nouveau flow diagnostic, suppression flash chat |
| Pages | `chat/[siren]/page.tsx`, `app/layout.tsx` | Post-paiement uniquement |

---

## Comment restaurer

Pour restaurer un fichier spécifique :
```bash
cp archive/pre-migration/src/lib/prompts/base.ts src/lib/prompts/base.ts
```

Pour tout restaurer :
```bash
cp -r archive/pre-migration/src/ src/
```

---

## Référence

- Inventaire complet : `/docs/INVENTORY.md`
- Plan de migration : `/docs/MIGRATION-PLAN.md`
- État actuel du produit : `/docs/CURRENT-STATE.md`
