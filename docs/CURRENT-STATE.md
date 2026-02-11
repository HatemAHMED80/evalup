# EvalUp - Document de revue pre-production

> **Objectif** : Permettre a un oeil neuf de challenger l'ensemble du produit avant mise en production.
> **Date** : Fevrier 2026
> **Stack** : Next.js 14 (App Router) + Supabase + Stripe + Anthropic Claude + Puppeteer E2E

---

## Table des matieres

1. [Vue d'ensemble du produit](#1-vue-densemble-du-produit)
2. [Architecture des pages](#2-architecture-des-pages)
3. [Flow utilisateur complet](#3-flow-utilisateur-complet)
4. [Methodologie d'evaluation](#4-methodologie-devaluation)
5. [Systeme de prompts IA](#5-systeme-de-prompts-ia)
6. [Secteurs supportes](#6-secteurs-supportes)
7. [Generation du rapport PDF](#7-generation-du-rapport-pdf)
8. [Securite et controle d'acces](#8-securite-et-controle-dacces)
9. [Integrations externes](#9-integrations-externes)
10. [Suite de tests E2E](#10-suite-de-tests-e2e)
11. [Points d'attention pour la revue](#11-points-dattention-pour-la-revue)

---

## 1. Vue d'ensemble du produit

**EvalUp** est un SaaS francais de valorisation d'entreprise par intelligence artificielle. L'utilisateur entre un numero SIREN, et un assistant IA (Claude) mene une conversation structuree pour estimer la valeur de l'entreprise.

### Proposition de valeur

| Offre | Prix | Description |
|-------|------|-------------|
| **Flash** | Gratuit | Estimation indicative en ~8 questions, 3-5 min |
| **Evaluation Complete** | 79 EUR | Analyse approfondie, retraitements, rapport PDF 30+ pages |
| **Pro 10** | 199 EUR/mois | 10 evaluations completes/mois |
| **Pro Illimite** | 399 EUR/mois | Evaluations illimitees |

### Donnees cles du produit

- **Methodes de valorisation** : Multiple EBITDA, Multiple CA, DCF, ANC, Praticiens
- **Secteurs couverts** : 15 (SaaS, Restaurant, BTP, Commerce, Sante, etc.)
- **Sources de donnees** : Pappers API (donnees INSEE/RCS/DGFIP)
- **IA** : Anthropic Claude (Haiku pour questions simples, Sonnet pour synthese)
- **Paiement** : Stripe (test + production)
- **Auth** : Supabase (email/password + Google OAuth)

---

## 2. Architecture des pages

### Arborescence complete

```
/                                    Landing Page (publique)
|
+-- /tarifs                          Page Tarifs - 4 plans + FAQ
+-- /aide                            Centre d'aide - FAQ par categories
|
+-- /(legal)/
|   +-- /contact                     Formulaire de contact
|   +-- /privacy                     Politique de confidentialite (RGPD)
|   +-- /cgv                         Conditions generales de vente
|   +-- /cgu                         Conditions generales d'utilisation
|   +-- /mentions-legales            Mentions legales (POSSE SAS)
|
+-- /(auth)/
|   +-- /connexion                   Connexion (email + Google OAuth)
|   +-- /inscription                 Inscription (email + Google OAuth)
|   +-- /mot-de-passe-oublie         Reinitialisation mot de passe
|   +-- /reset-password              Nouveau mot de passe (via lien email)
|
+-- /app/                            [PROTEGE] Dashboard
|   +-- /                            Formulaire SIREN -> lancer evaluation
|   +-- /evaluation/[id]             Vue evaluation (demo avec mock)
|   +-- /settings                    Preferences utilisateur
|
+-- /chat/[siren]                    [PROTEGE*] Interface de chat IA
|
+-- /checkout                        [PROTEGE] Paiement Stripe
|
+-- /compte/                         [PROTEGE] Gestion compte
    +-- /                            Profil utilisateur
    +-- /abonnement                  Abonnement en cours
    +-- /factures                    Historique factures
```

> *`/chat` a un auth check client-side, les autres routes protegees passent par le middleware serveur.

### Detail de chaque page

#### Pages publiques

| Route | Contenu principal | Elements cles |
|-------|-------------------|---------------|
| `/` | Landing page | Hero + CTA "Commencer gratuitement", sources de donnees (Pappers, INSEE, Infogreffe, BdF, BODACC), 3 etapes "Comment ca marche", grille features, temoignages, stats |
| `/tarifs` | Pricing | 4 cartes (Flash 0 EUR, Complete 79 EUR, Pro10 199 EUR/mois, Pro Illimite 399 EUR/mois), comparaison features, FAQ accordion |
| `/aide` | Centre d'aide | Barre de recherche, 4 categories FAQ (Premiers pas, Evaluations, Tarifs, Compte & Securite) |
| `/contact` | Contact | Formulaire (nom, email, sujet dropdown, message), coordonnees alternatives |
| `/privacy` | RGPD | Responsable traitement, donnees collectees, droits utilisateur, contact CNIL |
| `/cgv` | CGV | Description service, tarification, paiement, limitation responsabilite, droit applicable |
| `/cgu` | CGU | Utilisation autorisee/interdite, responsabilite, propriete intellectuelle |
| `/mentions-legales` | Mentions | POSSE SAS, SIRET 895 291 052 00010, President Hatem AHMED, hebergeur Vercel |

#### Pages d'authentification

| Route | Contenu principal | Elements cles |
|-------|-------------------|---------------|
| `/connexion` | Login | Split layout (branding gauche + form droite), email/password, "Se souvenir de moi", lien mot de passe oublie, bouton Google, lien inscription |
| `/inscription` | Signup | Email, mot de passe (8 car. min), confirmation, checkbox CGU/privacy, bouton Google, verification email |
| `/mot-de-passe-oublie` | Reset request | Formulaire email, message de confirmation apres envoi |
| `/reset-password` | New password | Nouveau mot de passe + confirmation, validation token |

#### Pages protegees (authentification requise)

| Route | Contenu principal | Elements cles |
|-------|-------------------|---------------|
| `/app` | Dashboard | Formulaire SIREN/SIRET centree, bouton "Lancer l'evaluation", info sources automatiques |
| `/chat/[siren]` | Chat IA | Header entreprise + stepper etapes, zone messages, suggestions rapides, input chat, grille bento donnees financieres, resultats valorisation |
| `/checkout` | Paiement | Redirect vers Stripe Checkout, gestion erreurs |
| `/compte` | Profil | Infos personnelles, securite (password, 2FA), zone danger |
| `/compte/abonnement` | Abonnement | Plan actuel, usage (evaluations, questions, PDFs), lien upgrade |
| `/compte/factures` | Factures | Tableau factures (ID, date, montant, statut, download) |

#### Routes API

| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/api/entreprise/[siren]` | Infos de base entreprise (Pappers) |
| GET | `/api/entreprise/[siren]/quick-valuation` | Donnees financieres + valorisation prelim. |
| POST | `/api/chat` | Envoi message au chat IA (Claude) |
| POST | `/api/evaluation/pdf` | Generation rapport PDF |
| POST | `/api/contact` | Soumission formulaire contact |
| GET | `/api/auth/callback` | Callback OAuth Google |
| POST | `/api/stripe/checkout` | Creation session Stripe |
| GET | `/api/stripe/portal` | Portail client Stripe |
| POST | `/api/stripe/webhooks` | Webhook Stripe (evenements paiement) |
| POST | `/api/documents/analyze` | Analyse documents uploades |
| GET/POST | `/api/pappers` | Proxy Pappers API |
| GET/POST | `/api/scrape-bodacc` | Scraping BODACC |
| GET | `/api/health/models` | Health check modeles IA |

---

## 3. Flow utilisateur complet

### 3.1 Parcours decouverte (non authentifie)

```
Landing (/)
  |
  +-- Clic "Commencer gratuitement"
  |     |
  |     +-- Si non connecte -> /connexion
  |     +-- Si connecte -> /app
  |
  +-- Clic "Tarifs" -> /tarifs
  |     |
  |     +-- Clic "Commencer" sur plan Flash -> /app (ou /connexion)
  |     +-- Clic "Acheter" sur plan Complete -> /checkout?plan=eval_complete
  |     +-- Clic "S'abonner" sur Pro -> /checkout?plan=pro_10 ou pro_unlimited
  |
  +-- Clic "Aide" -> /aide
  +-- Footer -> /cgv, /cgu, /privacy, /mentions-legales, /contact
```

### 3.2 Parcours inscription/connexion

```
/connexion
  |
  +-- Email + Password -> Supabase signInWithPassword
  |     +-- Succes -> redirect vers /app (ou URL de redirect si ?redirect=...)
  |     +-- Echec -> "Email ou mot de passe incorrect"
  |
  +-- Bouton Google -> Supabase signInWithOAuth
  |     +-- Redirect Google -> callback -> /app
  |
  +-- Lien "S'inscrire" -> /inscription
  +-- Lien "Mot de passe oublie" -> /mot-de-passe-oublie

/inscription
  |
  +-- Email + Password (8 car.) + Confirmation + CGU checkbox
  |     +-- Validation : passwords identiques, >= 8 car.
  |     +-- Succes -> "Verifiez votre email" (confirmation Supabase)
  |     +-- Erreur "deja utilise" si email existant
  |
  +-- Bouton Google -> meme flow OAuth
```

### 3.3 Parcours evaluation Flash (gratuit)

```
/app
  |
  +-- Saisie SIREN (9 chiffres) ou SIRET (14 chiffres)
  +-- Clic "Lancer l'evaluation"
  |
  v
/chat/[siren]
  |
  +-- CHARGEMENT INITIAL :
  |     1. API quick-valuation appele
  |     2. Validation SIREN (Luhn)
  |     3. Appel Pappers API -> donnees entreprise
  |     4. Detection secteur via code NAF
  |     5. Calcul valorisation prelim. (calculateur V2)
  |     6. Affichage grille bento (CA, resultat, effectif, etc.)
  |
  +-- CONVERSATION IA (8 questions max en Flash) :
  |
  |   Etape 1 - DECOUVERTE (2-3 questions)
  |     "Peux-tu me decrire l'activite de [Entreprise] ?"
  |     "Quel est l'objectif de cette valorisation ?"
  |     -> Boutons suggestion : Vente | Rachat associe | Levee | Divorce
  |
  |   Etape 2 - ANALYSE FINANCIERE (2-3 questions)
  |     "Quel est ton chiffre d'affaires 2024 ?"
  |     "Et ton resultat net ?"
  |     -> Pas de suggestions (reponse numerique)
  |
  |   Etape 3 - MARCHE & CLIENTS (2-3 questions)
  |     "Quel % du CA represente ton plus gros client ?"
  |     "Le dirigeant est-il indispensable au quotidien ?"
  |     -> Suggestions : Faible | Moyen | Fort
  |
  +-- RESULTAT FLASH :
  |     - Tableau : methode | fourchette basse | fourchette haute
  |     - Valorisation indicative : XXX EUR - YYY EUR
  |     - Marqueur [FLASH_VALUATION_COMPLETE]
  |     - CTA : "Passer a l'evaluation Complete pour 79 EUR"
  |
  +-- APRES FLASH :
        - Input chat desactive ("limite atteinte")
        - Bouton "Passer a l'evaluation Complete" (79 EUR)
        - Pas de PDF disponible
        - Pas d'upload de documents
```

### 3.4 Parcours upgrade vers Complete (79 EUR)

```
/chat/[siren] (apres Flash)
  |
  +-- Clic "Passer a l'evaluation Complete"
  |
  v
/checkout?plan=eval_complete&siren=[siren]
  |
  +-- Si non connecte -> /connexion?redirect=/checkout?...
  +-- Si connecte -> Creation session Stripe
  |
  v
Stripe Checkout (page externe)
  |
  +-- Paiement 79 EUR (carte test : 4242 4242 4242 4242)
  |
  +-- Succes -> /chat/[siren]?upgrade=success
  |     - Message "Paiement confirme"
  |     - Conversation reprend la ou elle s'est arretee
  |     - Questions illimitees
  |     - Upload documents active
  |     - PDF disponible a la fin
  |
  +-- Annulation -> /chat/[siren]?upgrade=canceled
        - Pas de message de succes
        - Retour au chat Flash
```

### 3.5 Parcours evaluation Complete

```
/chat/[siren]?upgrade=success
  |
  +-- CONVERSATION IA (illimitee) :
  |
  |   Etape 3 - ACTIFS & PASSIF
  |     "As-tu des emprunts bancaires en cours ?"
  |     "Quel est ton niveau de tresorerie ?"
  |     "Y a-t-il du credit-bail ?"
  |
  |   Etape 4 - EQUIPE & ORGANISATION
  |     "Quel est ton salaire brut charge ?"
  |     "Y a-t-il des membres de ta famille employes ?"
  |     "L'activite peut-elle tourner sans toi ?"
  |
  |   Etape 5 - MARCHE APPROFONDI
  |     "As-tu des contrats long terme > 1 an ?"
  |     "Quel est ton positionnement concurrentiel ?"
  |     "Y a-t-il des litiges en cours ?"
  |
  |   Etape 6 - SYNTHESE
  |     - Tous les retraitements appliques
  |     - Ajustements de risques calcules
  |     - Fourchette finale resserree (+/- 10-15%)
  |     - Marqueur [EVALUATION_COMPLETE]
  |
  +-- UPLOAD DOCUMENTS (optionnel) :
  |     - PDF (bilans comptables)
  |     - Excel (tableaux de suivi, listes clients)
  |     - Word (business plans)
  |     -> Extraction automatique des chiffres cles
  |     -> L'IA saute les questions deja repondues par les docs
  |
  +-- RESULTAT COMPLETE :
  |     - Valeur d'Entreprise (VE) : basse / mediane / haute
  |     - Prix de Cession = VE - Dette Financiere Nette
  |     - Detail des retraitements
  |     - Analyse des risques
  |     - Recommandations
  |
  +-- TELECHARGER PDF :
        - Bouton "Telecharger le rapport"
        - API /api/evaluation/pdf
        - Rapport professionnel 30+ pages
```

### 3.6 Parcours gestion de compte

```
/compte
  |
  +-- Profil : nom, email, entreprise, changement mot de passe
  +-- /compte/abonnement : plan actuel, usage, upgrade
  +-- /compte/factures : historique, download factures
  +-- Deconnexion
```

---

## 4. Methodologie d'evaluation

### 4.1 Vue d'ensemble du calcul

```
                DONNEES PAPPERS                    REPONSES UTILISATEUR
                (automatique)                       (conversation IA)
                     |                                     |
                     v                                     v
            +------------------+                 +-------------------+
            | Bilan comptable  |                 | Infos qualitatives|
            | CA, Resultat,    |                 | Salaire dirigeant |
            | Dettes, Tresor.  |                 | Dependance client |
            +--------+---------+                 | Litiges, Equipe   |
                     |                           +---------+---------+
                     |                                     |
                     +----------------+--------------------+
                                      |
                                      v
                          +------------------------+
                          |  EBITDA NORMALISE       |
                          |  = EBITDA comptable     |
                          |  + Retraitements        |
                          +----------+-------------+
                                     |
                    +----------------+----------------+
                    |                |                 |
                    v                v                 v
            +-----------+   +-------------+   +-----------+
            | Multiple  |   | Multiple CA |   |    DCF    |
            |  EBITDA   |   | (secondaire)|   | (si SaaS) |
            +-----------+   +-------------+   +-----------+
                    |                |                 |
                    +-------+--------+---------+-------+
                            |  Ponderation par secteur |
                            +----------+---------------+
                                       |
                                       v
                            +---------------------+
                            | VALEUR D'ENTREPRISE |
                            |      (VE)           |
                            +----------+----------+
                                       |
                                       v
                            +---------------------+
                            | - Dette Fin. Nette  |
                            |   (emprunts - cash) |
                            +----------+----------+
                                       |
                                       v
                            +---------------------+
                            |   PRIX DE CESSION   |
                            | (ce que paie l'acheteur)
                            +---------------------+
```

### 4.2 Calcul de l'EBITDA normalise

**Point de depart :**
```
EBITDA comptable = Resultat d'exploitation
                 + Dotations aux amortissements
                 + Dotations aux provisions
```

**Retraitements appliques (evaluation Complete uniquement) :**

| Retraitement | Logique | Exemple |
|--------------|---------|---------|
| **Salaire dirigeant** | Si sous-paye : AJOUTER l'ecart vs marche. Si sur-paye : DEDUIRE l'exces | Reel 40k vs norme 60k -> +20k |
| **Loyer** | Si local du dirigeant a loyer sous-marche : DEDUIRE l'ecart | Marche 50k, paye 30k -> -20k |
| **Credit-bail** | AJOUTER les loyers annuels a l'EBITDA, traiter le capital comme dette | 30k/an de leasing -> +30k |
| **Elements exceptionnels** | RETIRER charges/produits non-recurrents | Litige 2023 -> ajouter la provision |
| **Salaires familiaux** | Ajuster si au-dessus/en-dessous du marche | Fille a 50k, marche 30k -> -20k |

**Bareme salaire normatif du dirigeant :**

| CA de l'entreprise | Salaire normatif |
|-------------------|-----------------|
| < 500k EUR | 45 000 EUR |
| 500k - 1M EUR | 60 000 EUR |
| 1M - 2M EUR | 80 000 EUR |
| 2M - 5M EUR | 100 000 EUR |
| 5M - 10M EUR | 130 000 EUR |
| 10M - 20M EUR | 160 000 EUR |
| > 20M EUR | 200 000 EUR |

### 4.3 Multiples sectoriels (France 2024-2025)

| Secteur | Multiple EBITDA (min-med-max) |
|---------|------------------------------|
| Tech / SaaS | 5.0x - 7.0x - 10.0x |
| Sante / Pharmacie | 5.5x - 7.0x - 9.0x |
| Services B2B | 4.5x - 5.5x - 7.0x |
| Industrie | 4.0x - 5.0x - 6.5x |
| Distribution | 3.5x - 4.5x - 5.5x |
| BTP / Construction | 3.0x - 4.0x - 5.0x |
| Restaurant | 2.5x - 3.5x - 5.0x |
| Transport | 3.0x - 4.0x - 5.0x |
| Commerce / Retail | 3.0x - 4.0x - 5.5x |

**Ajustements appliques au multiple :**

| Facteur | Impact |
|---------|--------|
| **Taille** : CA < 500k | -1.5x a -2.0x |
| **Taille** : CA > 10M | +0.5x a +1.0x |
| **Localisation** : Paris | +15% a +25% |
| **Localisation** : Zone rurale | -5% a -15% |
| **Croissance** > 10%/an | +0.5x a +1.0x |
| **Recurrence** > 70% CA | +1.0x a +2.0x |
| **Croissance negative** | -0.5x a -1.0x |

### 4.4 Passage VE -> Prix de cession

```
Valeur d'Entreprise (VE)         500 000 EUR
- Emprunts bancaires           - 200 000 EUR
- Credit-bail restant          -  50 000 EUR
+ Tresorerie                   + 100 000 EUR
  -------------------------------------------
= DETTE FINANCIERE NETTE (DFN)  150 000 EUR

PRIX DE CESSION = VE - DFN = 500 000 - 150 000 = 350 000 EUR
```

**Important :** Le prix de cession est ce que l'acheteur paie reellement. La VE mesure la valeur des actifs operationnels.

### 4.5 Decotes et ajustements de risque (Complete uniquement)

| Decote | Quand | Impact |
|--------|-------|--------|
| **Minoritaire** | Participation < 50% | -15% a -25% |
| **Illiquidite** | Actions non cotees (toujours) | -10% a -20% |
| **Homme-cle** | Forte dependance au fondateur | -10% a -25% |
| **Concentration clients** | Top client > 30% du CA | -10% a -30% |
| **Clause statutaire** | Restrictions de cession | -5% a -15% |

**Application multiplicative (pas additive) :**
```
Exemple : VE = 1 000 000 EUR
Minoritaire -20%, Illiquidite -15%, Homme-cle -10%

= 1M x 0.80 x 0.85 x 0.90
= 1M x 0.612
= 612 000 EUR (decote totale : 38.8%)

Plafond pratique : ne depasse generalement pas 40-45% de decote totale
```

### 4.6 Methodes complementaires

| Methode | Usage | Formule simplifiee |
|---------|-------|-------------------|
| **Multiple CA** | Secondaire pour commerce, restaurant | VE = CA x Multiple (0.3x-1.0x selon secteur) |
| **ANC (Actif Net Corrige)** | Plancher / holdings / EBITDA negatif | ANC = Capitaux propres + Plus-values latentes - Provisions insuffisantes |
| **Praticiens** | Cross-validation | (CP + Resultat net / 10%) / 2 |
| **DCF** | SaaS / entreprises en croissance | Flux futurs actualises a 10-12% + valeur terminale |
| **Fonds de commerce** | Restaurant, commerce | CA x coeff. sectoriel |
| **Multiple ARR** | SaaS specifiquement | ARR x 3-15x selon croissance et churn |

---

## 5. Systeme de prompts IA

### 5.1 Hierarchie des prompts

```
BASE_SYSTEM_PROMPT (Complete : ~620 lignes)
|
+-- Regles de conversation (1 question a la fois, benchmarks obligatoires)
+-- Methodologie de retraitements (salaire, loyer, credit-bail)
+-- Questions de risque (litiges, concentration, dependance)
+-- Facteurs de decote (minoritaire, illiquidite, homme-cle)
+-- Progression en 6 etapes
+-- Format de sortie

FLASH_SYSTEM_PROMPT (~142 lignes)
|
+-- Limite a 8 questions
+-- Pas de documents
+-- Pas de retraitements
+-- Format simplifie
+-- Message d'upsell

PROMPT SECTORIEL (specifique par industrie)
|
+-- Explication du secteur
+-- Methodes de valorisation adaptees
+-- Questions specifiques
+-- Facteurs de prime
+-- Facteurs de decote

PROMPT PARCOURS (intention d'achat/vente)
|
+-- VENTE : optimiste, maximisation valeur
+-- ACHAT : prudent, focus risques
+-- ASSOCIE_RACHAT : valeur equitable
+-- DIVORCE : neutre, objectif
+-- FINANCEMENT : focus ratios
```

### 5.2 Regles cles du prompt

1. **Une seule question a la fois** — Jamais de listes de questions
2. **Annee de reference dynamique** — Apres juin : annee en cours. Avant juin : annee precedente
3. **Benchmark obligatoire** — Chaque commentaire doit comparer au secteur ("Ta marge de 3% est inferieure a la moyenne sectorielle de 5-8%")
4. **Suggestions uniquement qualitatif** — Suggestions pour "type de client" (B2B|B2C|Mixte), pas pour "montant du CA"
5. **Connaissance des documents** — Si un document uploade contient deja le CA, ne pas reposer la question

### 5.3 Selection de modele IA

| Contexte | Modele | Raison |
|----------|--------|--------|
| Questions 1-7 (simples) | Haiku | Rapide, economique |
| Synthese / retraitements | Sonnet | Plus precis |
| Donnees financieres complexes | Sonnet | Meilleure comprehension |
| Fallback | Modele suivant | Si indisponible |

### 5.4 Systeme de cache (prompt caching)

- Reponses courtes ("Oui", "Non", "Je ne sais pas") = cache hit
- Questions sectorielles recurrentes = cache hit
- Economies : 90% de reduction sur les tokens en cache
- Gain estime : 30-50% sur les evaluations repetitives

---

## 6. Secteurs supportes

### 6.1 Liste des 15 secteurs

| Secteur | Code | Codes NAF | Methode primaire | Specificite |
|---------|------|-----------|------------------|-------------|
| SaaS / Software | saas | 62.01Z, 62.02A/B, 63.11Z, 58.29A/B/C | Multiple ARR (70%) | MRR, churn, NRR, CAC/LTV |
| Restaurant | restaurant | 56.10A/B/C, 56.21Z, 56.30Z | Fonds de commerce (50%) | Licence IV, couverts, bail |
| Commerce | commerce | 45.xx, 46.xx, 47.xx | Multiple CA (50%) | Stock, emplacement, bail |
| E-commerce | ecommerce | 47.91A/B, 47.99A | Multiple CA (40%) | CAC, retention, panier moyen |
| Transport | transport | 49.xx, 50.xx, 51.xx, 52.xx | Multiple EBITDA (60%) | Flotte, capacite, autorisations |
| BTP | btp | 41.xx, 42.xx, 43.xx | Multiple EBITDA (60%) | Carnet commandes, marges, equipe |
| Industrie | industrie | 10.xx-33.xx | Multiple EBITDA (60%) | CapEx, BFR, carnet |
| Services | services | 62.xx (non-SaaS), 70.22Z, 73.xx | Multiple EBITDA (60%) | DSO, levier effectif, TJM |
| Pharmacie | pharmacie | 47.73Z | Multiple CA (50%) | Licence, clientele fidele |
| Laboratoire | labo | 74.30Z | Praticiens | Contrats clients, equipement |
| Medecin | medecin | 86.21Z/22Z | Praticiens | Patientele, adressage |
| Dentaire | dentaire | 86.23Z | Praticiens | Patientele, equipement, emplacement |
| Paramedical | paramedical | 86.90A/B | Praticiens | Licence, dependance patient |
| Sante (generique) | sante | 86.xx (fallback) | Variable | Selon sous-secteur |
| Default | default | Tout non-matche | Multiple EBITDA | Methode generique |

### 6.2 Detection automatique

```
1. Code NAF entre -> nettoyage (suppression espaces/points)
2. Recherche match exact dans les codes NAF de chaque secteur
3. Si pas de match exact -> recherche par division (2 premiers chiffres)
4. Si toujours rien -> secteur "default"
```

### 6.3 Prompts manuels vs auto-generes

- **5 secteurs avec prompts manuels detailles** : Transport, SaaS, Restaurant, Commerce, Services
  - Benchmarks specifiques, tableaux de multiples, questions sectorielles approfondies
  - Qualite superieure (~95%)

- **10 secteurs avec ConfigSecteur auto-genere** : BTP, Industrie, E-commerce, Pharmacie, Labo, Medecin, Dentaire, Paramedical, Sante, Default
  - Genere automatiquement depuis la configuration : methodes, questions, facteurs prime/decote
  - Qualite correcte (~80-90%)

---

## 7. Generation du rapport PDF

### 7.1 Structure du rapport (30+ pages)

| Section | Pages | Contenu |
|---------|-------|---------|
| **Couverture** | 1 | Logo, nom entreprise, date |
| **Sommaire** | 1 | Table des matieres |
| **Resume executif** | 2-3 | Fourchette VE, prix cession, multiple, DFN |
| **Presentation entreprise** | 2-3 | Activite, modele, position marche, historique |
| **Analyse financiere** | 5-7 | P&L 3 ans, bilan, ratios, evolution, comparaison secteur |
| **Diagnostic & scoring** | 3-5 | Note globale (A-E), forces, faiblesses, benchmarks |
| **Detail valorisation** | 5-7 | Normalisation EBITDA, methodes, ponderations, justification multiples |
| **Pont VE -> Prix** | 2 | Tableau dette nette, passage VE au prix de cession |
| **Analyse qualitative** | 2-3 | Marche, risques, homme-cle, concentration, recommandations |
| **Annexes** | 3-5 | Methodologies, hypotheses, glossaire, contact |

### 7.2 Stack technique

- **@react-pdf/renderer** : generation PDF cote serveur (Node.js)
- **API** : `POST /api/evaluation/pdf`
- **Flow** : Clic "Telecharger" -> assemblage donnees -> rendu React -> stream PDF -> download

---

## 8. Securite et controle d'acces

### 8.1 Protection des routes

| Mecanisme | Routes | Comportement |
|-----------|--------|-------------|
| **Middleware serveur** (Supabase SSR) | `/app`, `/compte`, `/api/user` | Redirect vers `/connexion?redirect=...` |
| **Auth check client-side** | `/chat/[siren]` | Redirect si pas de session |
| **Redirect si deja connecte** | `/connexion`, `/inscription`, `/mot-de-passe-oublie` | Redirect vers `/` |
| **Checkout** | `/checkout` | Redirect vers `/connexion` si non auth |

### 8.2 Headers de securite (middleware)

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### 8.3 Controle d'acces Flash vs Complete

| Fonctionnalite | Flash (gratuit) | Complete (79 EUR) |
|----------------|-----------------|-------------------|
| Questions IA | 8 max | Illimite |
| Upload documents | Desactive | Active |
| Telechargement PDF | Non (CTA upgrade) | Oui |
| Retraitements | Non | Oui |
| Analyse de risques | Non | Oui |
| Fourchette | Large (+/- 20-30%) | Resserree (+/- 10-15%) |

---

## 9. Integrations externes

| Service | Usage | Cle API |
|---------|-------|---------|
| **Pappers** | Donnees entreprises (SIREN, bilans, dirigeants) | `PAPPERS_API_KEY` |
| **Anthropic Claude** | Assistant IA (Haiku + Sonnet) | `ANTHROPIC_API_KEY` |
| **Supabase** | Auth + BDD + Realtime | `SUPABASE_URL` + `SUPABASE_ANON_KEY` + `SERVICE_ROLE_KEY` |
| **Stripe** | Paiement (checkout, webhooks, portal) | `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` |
| **Resend** | Emails transactionnels | `RESEND_API_KEY` |
| **Google Analytics** | Tracking (GA4) | `G-5CDRQB90BP` |
| **Google OAuth** | Connexion sociale | Via Supabase (provider non encore active) |

---

## 10. Suite de tests E2E

### 10.1 Infrastructure de test

- **Framework** : Puppeteer (headless Chrome)
- **Runner** : `tests/run-tests.ts` — modulaire, CLI avec selection de modules
- **Reporter** : JSON + texte avec resume colore
- **Logger** : Fichiers logs + console
- **Screenshots** : Capture automatique a chaque test
- **Config** : `tests/config.ts` (baseUrl, headless, slowMo, credentials, SIRENs de test)

### 10.2 Modules et tests (75 tests au total)

#### Module NAVIGATION (12 tests)

| # | Test | Verifie |
|---|------|---------|
| 1 | Landing page charge | Titre "EvalUp", CTA visible |
| 2 | CTA hero -> /app ou /connexion | Redirect correcte |
| 3 | CTA "Voir un exemple" PDF | Telechargement PDF demarre |
| 4 | Nav lien Tarifs | Navigation vers /tarifs |
| 5 | Pricing page 4 plans | 4 plans affiches (Flash, Complete, Pro10, Pro Illimite) |
| 6 | FAQ accordion | Expand/collapse fonctionne |
| 7 | Page Aide charge | Contenu suffisant |
| 8 | Pages legales chargent | CGV, CGU, Privacy, Mentions = h1 present, pas d'erreur |
| 9 | Page Contact charge | Formulaire avec champs |
| 10 | Contact form validation | Erreur si soumission vide |
| 11 | Footer liens fonctionnent | Chaque lien mene a la bonne page |
| 12 | Page 404 ne crash pas | Pas d'erreur 500 |

#### Module ACCESS-CONTROL (10 tests)

| # | Test | Verifie |
|---|------|---------|
| 1 | /app redirige si non-auth | Redirect vers /connexion |
| 2 | /chat sans auth | Accessible (Flash) ou redirect |
| 3 | /compte redirige si non-auth | Redirect vers /connexion |
| 4 | Flash : 8 questions max | Message "limite atteinte" apres 8 questions |
| 5 | Flash : pas de PDF download | Bouton "Passer a Pro" au lieu de "Telecharger" |
| 6 | Flash : upload doc desactive | Bouton desactive ou message premium |
| 7 | Upgrade CTA visible | Bouton avec "79 EUR" ou "Complete" visible |
| 8 | Checkout sans auth -> login | Redirect vers /connexion?redirect=... |
| 9 | Retour ?upgrade=success | Message de confirmation affiche |
| 10 | Retour ?upgrade=canceled | Pas de message de succes |

#### Module AUTH (13 tests)

| # | Test | Verifie |
|---|------|---------|
| 1 | Page connexion charge | Email, password, Google, lien inscription |
| 2 | Page inscription charge | Email, 2x password, checkbox CGU |
| 3 | Login mauvais identifiants | Message d'erreur affiche |
| 4 | Inscription : mdp trop court | Erreur validation < 8 caracteres |
| 5 | Inscription : mdp differents | Erreur "ne correspondent pas" |
| 6 | Page mot de passe oublie | Email input, bouton envoi |
| 7 | Mdp oublie : confirmation | Message "email envoye" apres soumission |
| 8 | Navigation connexion <-> inscription | Liens fonctionnent dans les 2 sens |
| 9 | Connexion reussie | Login avec compte test -> redirect /app |
| 10 | /app accessible apres connexion | Contenu SIREN visible apres login |
| 11 | /compte accessible apres connexion | Page profil chargee |
| 12 | Connexion avec redirect | Parametre redirect preserve apres login |
| 13 | Bouton Google -> OAuth | Requete OAuth envoyee (warn si provider desactive) |

#### Module MOBILE (14 tests)

| # | Test | Viewport | Verifie |
|---|------|----------|---------|
| 1 | Landing mobile layout | iPhone SE (375x667) | Pas de scroll horizontal, CTA visible |
| 2 | Nav hamburger menu | 375px | Menu hamburger apparait, nav desktop cachee |
| 3 | Menu mobile navigation | 375px | Liens du menu fonctionnent |
| 4 | Pricing cards mobile | 375px | Cards empilees, prix lisibles |
| 5 | iPad pricing layout | iPad (768x1024) | Grid 2 colonnes |
| 6 | Pas de debordement horizontal | 375px | scrollWidth <= innerWidth sur toutes les pages |
| 7 | Legal pages mobile | 375px | Texte lisible, pas d'overflow |
| 8 | Chat mobile layout | iPhone 14 (390x844) | Textarea en bas, pas de sidebar |
| 9 | Bento grid mobile | 390px | Grid responsive, pas d'overflow |
| 10 | iPad chat layout | 768px | Textarea accessible |
| 11 | Sidebar mobile toggle | 390px | Toggle sidebar fonctionne |
| 12 | Chat input mobile | 390px | Envoi message + reponse bot recue |
| 13 | Suggestions mobile | 390px | Boutons ne depassent pas l'ecran |
| 14 | Touch scroll chat | 390px | Auto-scroll, dernier message visible |

#### Module CHAT (8 tests)

| # | Test | Verifie |
|---|------|---------|
| 1 | Recherche SIREN valide | Company card + redirect vers chat |
| 2 | Recherche SIREN invalide (Luhn) | Message d'erreur |
| 3 | Affichage Bento Grid | Grille donnees (CA, resultat, valorisation) |
| 4 | Selection objectif | Boutons objectif cliquables |
| 5 | Conversation Flash complete | Flow complet 8 questions avec reponses realistes |
| 6 | Affichage valorisation Flash | Elements de valorisation affiches |
| 7 | Pertinence des suggestions | Suggestions contextuelles (pas toutes generiques) |
| 8 | Sauvegarde/restauration brouillon | Draft sauve et restaure au rechargement |

#### Module PAYMENT (6 tests)

| # | Test | Verifie |
|---|------|---------|
| 1 | Bouton upgrade vers checkout | Navigation vers checkout (79 EUR, Complete) |
| 2 | Page checkout charge | Page charge ou redirect auth |
| 3 | Redirection Stripe | Redirect vers Stripe ou login |
| 4 | Retour apres paiement reussi | Confirmation + mise a jour contexte |
| 5 | Gestion annulation paiement | Pas d'erreur ni de message succes |
| 6 | Affichage prix correct | 79 EUR affiche correctement |

#### Module AI-QUALITY (8 tests)

| # | Test | Verifie |
|---|------|---------|
| 1 | Premiere question pertinente | Contient "?", mentionne activite/valorisation |
| 2 | Adaptation au secteur | Questions differentes boulangerie vs cabinet conseil |
| 3 | Suggestions contextuelles | Changent apres chaque reponse |
| 4 | Pas de repetition | Aucune question posee 2 fois en 4+ messages |
| 5 | Progression thematique | Decouverte -> Financier -> Equipe -> Marche -> Risques |
| 6 | Valorisation Flash coherente | Valorisation affichee apres toutes les questions |
| 7 | Reponses en francais | Aucun texte en anglais detecte |
| 8 | Format suggestions valide | Pas de balises [SUGGESTIONS] brutes visibles |

#### Module FULL-FLOW (4 tests)

| # | Test | Verifie |
|---|------|---------|
| 1 | Flow complet : Boulangerie Martin | Parcours complet boulangerie -> valorisation |
| 2 | Flow complet : Agence Digitale | Parcours complet agence web -> valorisation |
| 3 | Flow complet : Restaurant Difficulte | Parcours restaurant en difficulte -> valorisation |
| 4 | Flow complet : Cabinet Conseil | Parcours cabinet conseil -> valorisation |

### 10.3 Commandes de lancement

```bash
# Tests rapides (sans IA) — ~3 min
npm run test:quick    # navigation + access-control + auth + mobile (49 tests)

# Tests par module
npm run test:auth     # 13 tests auth
npm run test:mobile   # 14 tests mobile

# Tests avec IA — ~10 min
npm run test:ai       # 8 tests qualite IA
npm run test:all      # Tous les 75 tests

# Debug (navigateur visible)
TEST_HEADLESS=false npm run test:mobile

# Ralenti (debug)
TEST_SLOW_MO=100 npm run test:chat
```

### 10.4 Resultats actuels

```
Module             Tests    Statut
----------------------------------
Navigation          12/12   100% OK
Access-Control      10/10   100% OK
Auth                13/13   100% OK
Mobile              14/14   100% OK
----------------------------------
Quick total         49/49   100% OK

Chat                 8/8    Non teste cette session
Payment              6/6    Non teste cette session
AI-Quality           8/8    Non teste cette session
Full-Flow            4/4    Non teste cette session
```

---

## 11. Points d'attention pour la revue

### 11.1 Points a challenger - Produit

- [ ] **Flow Flash -> Complete** : Le passage de gratuit a 79 EUR est-il fluide ? L'utilisateur comprend-il ce qu'il gagne ?
- [ ] **8 questions Flash** : Suffisant pour donner une estimation credible ? Trop/pas assez ?
- [ ] **Pricing** : 79 EUR pour une evaluation complete — bien positionne par rapport au marche ?
- [ ] **Page /app** : Le formulaire SIREN est-il suffisant comme dashboard ? Historique des evaluations ?
- [ ] **Pages compte** : Profil, abonnement, factures — donnees actuellement mockees
- [ ] **Contact** : Formulaire en place, emails via Resend
- [ ] **Legal** : CGV, CGU, Privacy, Mentions legales — a faire verifier par un juriste
- [ ] **Mot de passe oublie** : Reset logic marque TODO dans le code (simule avec setTimeout)

### 11.2 Points a challenger - Methodologie

- [ ] **Multiples sectoriels** : Sources des multiples ? Mise a jour annuelle prevue ?
- [ ] **Bareme salaire dirigeant** : Correspond aux pratiques du marche ?
- [ ] **Ponderation des methodes** : 60% EBITDA, 25% CA, 15% ANC — justifie ?
- [ ] **Decotes cumulatives** : Plafond a 40-45% — raisonnable ?
- [ ] **Secteurs auto-generes** : 10 secteurs sans prompts manuels — qualite suffisante ?
- [ ] **SaaS** : Multiple ARR 3-15x — fourchette tres large, comment affiner ?

### 11.3 Points a challenger - Technique

- [ ] **Google OAuth** : Provider non active dans Supabase — a configurer avant prod
- [ ] **CSP** : Google Fonts et Google Analytics bloques par Content-Security-Policy actuelle
- [ ] **`/chat` auth** : Check client-side (pas middleware) — risque de flash de contenu
- [ ] **Pages compte** : Donnees mockees (Jean Dupont, factures fictives) — brancher sur Supabase/Stripe
- [ ] **Evaluation /app/evaluation/[id]** : Page demo avec mock — brancher sur vrais resultats
- [ ] **Settings** : Preferences (theme, langue, notifications) — pas encore fonctionnel

### 11.4 Elements non testes

- [ ] **Generation PDF reelle** (necessite evaluation complete payee)
- [ ] **Paiement Stripe reel** (tests limites au flow redirect)
- [ ] **Upload de documents** (analyse via Claude)
- [ ] **Emails transactionnels** (Resend)
- [ ] **Performance/charge** (temps de reponse IA, limites tokens)
- [ ] **Multi-navigateurs** (tests uniquement sur Chromium/Puppeteer)
