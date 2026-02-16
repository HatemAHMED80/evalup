// Archétypes de valorisation EvalUp
// Source : /docs/ARCHETYPES.xlsx (Damodaran NYU Stern + méthodologie Thauvron)

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface CommonMistake {
  mistake: string
  impact: string
  icon: string
}

export interface KeyFactor {
  factor: string
  impact: string
  direction: 'up' | 'down'
}

export interface Archetype {
  id: string
  name: string
  icon: string
  color: string
  primaryMethod: string
  secondaryMethod: string
  metricBase: string
  whyThisMethod: string
  commonMistakes: CommonMistake[]
  keyFactors: KeyFactor[]
  reportIncludes: string[]
  requiredDataFlash: string[]
  requiredDataComplete: string[]
}

// -----------------------------------------------------------------------------
// Les 15 archétypes
// -----------------------------------------------------------------------------

export const ARCHETYPES: Record<string, Archetype> = {
  // ── TECH / DIGITAL ────────────────────────────────────────────────────────

  saas_hyper: {
    id: 'saas_hyper',
    name: 'SaaS Hyper-croissance',
    icon: '🚀',
    color: '#6C5CE7',
    primaryMethod: "Multiple d'ARR",
    secondaryMethod: 'Rule of 40 (Croissance + Marge)',
    metricBase: 'ARR = MRR × 12',
    whyThisMethod:
      "Quand la croissance dépasse 40 % et que l'EBITDA est négatif, le multiple d'ARR est la seule métrique pertinente. Les investisseurs paient pour la trajectoire de revenus récurrents, pas pour un résultat comptable qui reflète des investissements de conquête. Range : 8x–25x ARR.",
    commonMistakes: [
      {
        mistake: "Utiliser un multiple d'EBITDA sur un EBITDA négatif",
        impact: 'Valorisation absurde (négative ou nulle)',
        icon: '🚫',
      },
      {
        mistake: 'Confondre MRR et CA total',
        impact: 'Surévaluation si le CA inclut du one-shot',
        icon: '⚠️',
      },
      {
        mistake: 'Ignorer le churn dans le calcul ARR',
        impact: "Un churn > 5 %/mois divise le multiple par 2",
        icon: '📉',
      },
    ],
    keyFactors: [
      { factor: 'NRR > 120 %', impact: 'Multiple haut de fourchette', direction: 'up' },
      { factor: 'CAC Payback < 12 mois', impact: 'Efficacité commerciale prouvée', direction: 'up' },
      { factor: 'Croissance qui accélère', impact: 'Prime de momentum', direction: 'up' },
      { factor: 'TAM > 1 Md€', impact: 'Potentiel de marché large', direction: 'up' },
      { factor: 'Churn > 5 %/mois', impact: 'Hémorragie de revenus', direction: 'down' },
      { factor: 'CAC en hausse', impact: 'Croissance non rentable', direction: 'down' },
      { factor: 'Concentration clients', impact: 'Risque de perte brutale', direction: 'down' },
      { factor: 'Burn rate > 18 mois runway', impact: 'Risque de dilution forcée', direction: 'down' },
    ],
    reportIncludes: [
      'Analyse ARR et décomposition MRR',
      'Métriques SaaS (NRR, churn, CAC, LTV)',
      'Rule of 40',
      'Comparables transactions SaaS',
      'Scénarios de valorisation (bear/base/bull)',
      'Analyse de la rétention par cohorte',
    ],
    requiredDataFlash: ['MRR', 'Croissance mensuelle', 'Churn rate', 'ARR'],
    requiredDataComplete: [
      'CAC',
      'LTV',
      'NRR',
      'Cohort retention',
      'Runway (mois de cash)',
      'Effectifs R&D vs Sales',
    ],
  },

  saas_mature: {
    id: 'saas_mature',
    name: 'SaaS Mature & Rentable',
    icon: '📊',
    color: '#0984E3',
    primaryMethod: "Multiple d'EBITDA + validation ARR",
    secondaryMethod: 'DCF 5 ans avec terminal value',
    metricBase: 'EBITDA normalisé',
    whyThisMethod:
      "Un SaaS rentable (EBITDA > 15 %) combine la prédictibilité des revenus récurrents avec une marge prouvée. Le multiple d'EBITDA (10x–20x) capture la rentabilité, validé par un cross-check en multiple d'ARR (4x–10x). Le DCF confirme sur 5 ans.",
    commonMistakes: [
      {
        mistake: 'Appliquer un multiple de SaaS hyper-croissance à un SaaS mature',
        impact: 'Surévaluation de 2x–3x',
        icon: '📈',
      },
      {
        mistake: 'Ne pas distinguer ARR contractuel vs mensuel sans engagement',
        impact: 'Le ARR sans engagement a un churn implicite plus élevé',
        icon: '📋',
      },
      {
        mistake: 'Ignorer le ralentissement de croissance',
        impact: 'Si croissance < 5 %, basculer sur archétype "déclin"',
        icon: '🔄',
      },
    ],
    keyFactors: [
      { factor: 'NRR > 110 %', impact: 'Expansion nette des revenus existants', direction: 'up' },
      { factor: 'Marge EBITDA > 30 %', impact: 'Rentabilité best-in-class', direction: 'up' },
      { factor: 'Croissance > 20 %', impact: 'Croissance soutenue à maturité', direction: 'up' },
      { factor: 'Churn < 2 %', impact: 'Base clients très fidèle', direction: 'up' },
      { factor: 'Croissance < 10 %', impact: 'Risque de stagnation', direction: 'down' },
      { factor: 'Churn en hausse', impact: 'Signal de dégradation produit', direction: 'down' },
      { factor: 'Techno vieillissante', impact: 'Coût de modernisation à prévoir', direction: 'down' },
      { factor: 'Marché saturé', impact: 'Plafond de croissance', direction: 'down' },
    ],
    reportIncludes: [
      'Valorisation EBITDA + cross-check ARR',
      'DCF 5 ans avec terminal value',
      'Métriques SaaS (NRR, churn, ARPU)',
      'Comparables transactions',
      'Analyse de la marge et tendances',
      'Projection de cash-flows',
    ],
    requiredDataFlash: ['CA', 'EBITDA', 'MRR', 'Croissance annuelle', 'Churn'],
    requiredDataComplete: [
      'NRR',
      'CAC payback',
      'Répartition CA par plan',
      'Ancienneté clients',
      'ARPU évolution',
    ],
  },

  saas_decline: {
    id: 'saas_decline',
    name: 'SaaS en perte de vitesse',
    icon: '📉',
    color: '#D35400',
    primaryMethod: "Multiple d'EBITDA avec décote",
    secondaryMethod: 'DCF pessimiste (scénarios déclin)',
    metricBase: 'EBITDA normalisé',
    whyThisMethod:
      "Quand la croissance est nulle ou négative et le churn augmente, le multiple d'EBITDA reste pertinent mais avec une décote de 20–40 % par rapport à un SaaS mature. Le DCF intègre des scénarios de déclin. Range : 4x–8x EBITDA.",
    commonMistakes: [
      {
        mistake: 'Appliquer les mêmes multiples que pour un SaaS en croissance',
        impact: 'Surévaluation de 50 % ou plus',
        icon: '💸',
      },
      {
        mistake: 'Ignorer le scénario de liquidation',
        impact: 'Valeur plancher = base clients × LTV résiduelle',
        icon: '🏚️',
      },
      {
        mistake: "Ne pas analyser les raisons du déclin",
        impact: 'Déclin conjoncturel ≠ déclin structurel (impact sur le multiple)',
        icon: '🔍',
      },
    ],
    keyFactors: [
      { factor: 'Base clients large', impact: 'Valeur résiduelle importante', direction: 'up' },
      { factor: 'Marque reconnue', impact: 'Potentiel de repositionnement', direction: 'up' },
      { factor: 'IP / brevets', impact: 'Actif valorisable séparément', direction: 'up' },
      { factor: 'Cash généré stable', impact: 'Cash cow malgré le déclin', direction: 'up' },
      { factor: 'Churn accéléré', impact: 'Érosion rapide de la base', direction: 'down' },
      { factor: "Pas d'innovation produit", impact: 'Décrochage vs concurrence', direction: 'down' },
      { factor: 'Concurrence forte', impact: 'Pression prix et parts de marché', direction: 'down' },
      { factor: 'Techno obsolète', impact: 'Coût de refonte prohibitif', direction: 'down' },
    ],
    reportIncludes: [
      "Valorisation EBITDA avec décote d'obsolescence",
      'DCF scénarios pessimiste / base / optimiste',
      'Analyse du churn et tendances 24 mois',
      'Valeur plancher (liquidation)',
      'Valeur de la base clients (LTV résiduelle)',
      'Comparables acquisitions de SaaS en déclin',
    ],
    requiredDataFlash: ['CA', 'EBITDA', 'MRR', 'Croissance (négative)', 'Churn'],
    requiredDataComplete: [
      'Évolution MRR 24 mois',
      'Raisons du churn',
      'Pipeline commercial',
      'Budget R&D',
      'Cash restant',
    ],
  },

  marketplace: {
    id: 'marketplace',
    name: 'Marketplace / Plateforme',
    icon: '🏪',
    color: '#00B894',
    primaryMethod: 'Multiple de GMV ou Take Rate × GMV',
    secondaryMethod: 'Comparables transactions similaires',
    metricBase: 'GMV ou CA net (commission)',
    whyThisMethod:
      "Une marketplace se valorise sur son volume transactionnel (GMV) et sa capacité à en capturer une part (take rate). Le GMV n'est pas du revenu : c'est le CA net (take rate × GMV) qui compte. Range : 1x–4x GMV ou 5x–15x CA net.",
    commonMistakes: [
      {
        mistake: 'Présenter le GMV comme du chiffre d\'affaires',
        impact: 'Surévaluation massive (GMV peut être 10–20x le CA réel)',
        icon: '🚫',
      },
      {
        mistake: 'Ignorer le risque de désintermédiation',
        impact: 'Les vendeurs/acheteurs peuvent se passer de la plateforme',
        icon: '🔓',
      },
      {
        mistake: 'Ne pas vérifier le Product-Market Fit',
        impact: 'Sans PMF, valoriser comme early stage (pas comme marketplace)',
        icon: '🎯',
      },
    ],
    keyFactors: [
      { factor: 'Effet réseau prouvé', impact: 'Barrière à l\'entrée naturelle', direction: 'up' },
      { factor: 'Liquidité forte (offre + demande)', impact: 'Plateforme auto-alimentée', direction: 'up' },
      { factor: 'Take rate stable ou croissant', impact: 'Pouvoir de pricing', direction: 'up' },
      { factor: 'Rétention vendeurs > 70 %', impact: 'Offre pérenne', direction: 'up' },
      { factor: 'Mono-catégorie', impact: 'Marché adressable limité', direction: 'down' },
      { factor: 'Désintermédiation facile', impact: 'Les utilisateurs contournent la plateforme', direction: 'down' },
      { factor: 'Take rate en baisse', impact: 'Pression concurrentielle', direction: 'down' },
      { factor: 'Subventions pour croître', impact: 'Croissance non organique', direction: 'down' },
    ],
    reportIncludes: [
      'Analyse GMV vs CA net',
      'Décomposition du take rate',
      'Métriques marketplace (liquidité, repeat rate, panier moyen)',
      'Analyse de l\'effet réseau',
      'Comparables transactions marketplace',
      'Risque de désintermédiation',
    ],
    requiredDataFlash: ['GMV', 'Take rate', 'CA net', 'Croissance', 'Nb vendeurs/acheteurs'],
    requiredDataComplete: [
      'Ratio vendeurs/acheteurs (liquidité)',
      'Repeat rate',
      'Panier moyen',
      'Taux de désintermédiation',
    ],
  },

  ecommerce: {
    id: 'ecommerce',
    name: 'E-commerce / D2C',
    icon: '🛒',
    color: '#FDCB6E',
    primaryMethod: "Multiple de CA ou EBITDA si rentable",
    secondaryMethod: 'DCF + valorisation marque',
    metricBase: 'CA (ou EBITDA si > 10 %)',
    whyThisMethod:
      "Un e-commerce sans forte récurrence se valorise sur son CA (1x–3x) ou, s'il est rentable, sur son EBITDA (6x–12x). La marque, le trafic organique et le taux de repeat sont les vrais différenciateurs par rapport au dropshipping.",
    commonMistakes: [
      {
        mistake: 'Valoriser du dropshipping comme une marque D2C',
        impact: 'Dropshipping pur = 0.5x–1x CA max',
        icon: '📦',
      },
      {
        mistake: "Ignorer la dépendance à la publicité payante",
        impact: 'Si 80 % du trafic est Meta/Google Ads, la rentabilité est fragile',
        icon: '💰',
      },
      {
        mistake: "Ne pas valoriser les stocks au prix de liquidation",
        impact: 'Stocks invendus = passif caché, pas un actif',
        icon: '🏷️',
      },
    ],
    keyFactors: [
      { factor: 'Marque forte (trafic organique)', impact: 'Acquisition gratuite et durable', direction: 'up' },
      { factor: 'Marge brute > 60 %', impact: 'Pricing power et marque premium', direction: 'up' },
      { factor: 'Panier moyen croissant', impact: 'Montée en gamme réussie', direction: 'up' },
      { factor: 'Taux de repeat > 30 %', impact: 'Base clients fidélisée', direction: 'up' },
      { factor: 'Dépendance Meta/Google Ads', impact: 'Marge absorbée par le paid', direction: 'down' },
      { factor: 'Marge brute < 40 %', impact: 'Pas de room pour investir', direction: 'down' },
      { factor: 'Pas de marque propre', impact: 'Aucune barrière à l\'entrée', direction: 'down' },
      { factor: 'Forte saisonnalité', impact: 'Cash-flow irrégulier', direction: 'down' },
    ],
    reportIncludes: [
      'Valorisation CA + EBITDA si rentable',
      'Analyse de la marque et du trafic',
      'Métriques e-commerce (repeat, panier, CAC)',
      'Valorisation des stocks',
      'Analyse mix trafic organique vs payant',
      'Comparables D2C',
    ],
    requiredDataFlash: ['CA', 'Marge brute', 'EBITDA', 'Croissance', 'Panier moyen'],
    requiredDataComplete: [
      'Taux repeat',
      'CAC',
      '% trafic organique vs payant',
      'Valorisation stocks',
      'Taux de retours',
    ],
  },

  // ── SERVICES ──────────────────────────────────────────────────────────────

  conseil: {
    id: 'conseil',
    name: 'Conseil / Services intellectuels',
    icon: '🧠',
    color: '#A29BFE',
    primaryMethod: "Multiple d'EBITDA (bas de fourchette)",
    secondaryMethod: 'Multiple de CA en validation',
    metricBase: 'EBITDA retraité (rémunération dirigeant)',
    whyThisMethod:
      "Un cabinet de conseil dépend fortement de ses consultants et souvent du dirigeant. Le multiple d'EBITDA (4x–8x) est bas car le principal actif — les gens — peut partir. Le retraitement de la rémunération du dirigeant est obligatoire.",
    commonMistakes: [
      {
        mistake: 'Ne pas retraiter la rémunération du dirigeant',
        impact: "L'EBITDA affiché ne reflète pas la rentabilité réelle",
        icon: '💼',
      },
      {
        mistake: "Ignorer la dépendance homme-clé",
        impact: 'Si > 50 % du CA dépend du dirigeant, décote de 20–40 %',
        icon: '👤',
      },
      {
        mistake: "Ne pas prévoir d'earn-out",
        impact: 'Earn-out fréquent (30–50 % du prix) pour sécuriser la transition',
        icon: '🤝',
      },
    ],
    keyFactors: [
      { factor: 'Équipe diversifiée (pas 1 personne)', impact: 'Risque homme-clé faible', direction: 'up' },
      { factor: 'Contrats récurrents / retainers', impact: 'Prédictibilité du CA', direction: 'up' },
      { factor: 'Expertise de niche', impact: 'Pricing power et barrière', direction: 'up' },
      { factor: 'Marque / réputation', impact: 'Pipeline de prospects entrant', direction: 'up' },
      { factor: 'Dépendance dirigeant forte', impact: 'Décote homme-clé 20–40 %', direction: 'down' },
      { factor: 'Pas de process documentés', impact: 'Non transférable', direction: 'down' },
      { factor: "Turnover équipe élevé", impact: 'Perte de savoir-faire', direction: 'down' },
      { factor: 'Clients non contractualisés', impact: 'CA volatile', direction: 'down' },
    ],
    reportIncludes: [
      'Valorisation EBITDA retraité',
      'Analyse de la dépendance homme-clé',
      'Répartition CA par client',
      'Analyse turnover et compétences',
      'Comparables cabinets de conseil',
      'Structure d\'earn-out recommandée',
    ],
    requiredDataFlash: ['CA', 'EBITDA', 'Rémunération dirigeant', 'Nb consultants', 'TJM'],
    requiredDataComplete: [
      'Répartition CA par client',
      'Ancienneté clients',
      "Turnover équipe",
      'Carnet de commandes',
    ],
  },

  services_recurrents: {
    id: 'services_recurrents',
    name: 'Services récurrents / Abonnement physique',
    icon: '🔄',
    color: '#00CEC9',
    primaryMethod: "Multiple d'EBITDA + valeur base clients",
    secondaryMethod: 'Multiple de CA récurrent (2x–4x)',
    metricBase: 'EBITDA normalisé',
    whyThisMethod:
      "Des revenus récurrents > 60 % avec un service physique (maintenance, nettoyage, sécurité) justifient un multiple d'EBITDA de 5x–10x. La base clients contractualisée ajoute de la prédictibilité. Le cross-check en CA récurrent valide.",
    commonMistakes: [
      {
        mistake: 'Confondre CA récurrent et CA total',
        impact: 'Seul le CA contractualisé compte pour le multiple récurrent',
        icon: '📄',
      },
      {
        mistake: "Ignorer les engagements sociaux",
        impact: 'Congés payés, primes, provisions retraite = passif caché',
        icon: '⚖️',
      },
      {
        mistake: 'Sous-estimer le turnover salariés',
        impact: 'Coût de remplacement = 3–6 mois de salaire par poste',
        icon: '🚪',
      },
    ],
    keyFactors: [
      { factor: 'Contrats > 12 mois', impact: 'Visibilité long terme', direction: 'up' },
      { factor: 'Churn < 10 %/an', impact: 'Base clients stable', direction: 'up' },
      { factor: 'Panier croissant', impact: 'Up-sell réussi', direction: 'up' },
      { factor: 'Scalabilité prouvée', impact: 'Potentiel de croissance', direction: 'up' },
      { factor: "Forte intensité main d'œuvre", impact: 'Marge sous pression', direction: 'down' },
      { factor: 'Turnover salariés', impact: 'Coûts de recrutement récurrents', direction: 'down' },
      { factor: 'Réglementation', impact: 'Risque de changement réglementaire', direction: 'down' },
      { factor: 'Saisonnalité forte', impact: 'Cash-flow irrégulier', direction: 'down' },
    ],
    reportIncludes: [
      'Valorisation EBITDA + base clients',
      'Analyse CA récurrent vs ponctuel',
      'Métriques de rétention clients',
      'Analyse masse salariale et turnover',
      'Comparables services récurrents',
      'Projection de la base clients',
    ],
    requiredDataFlash: ['CA', 'EBITDA', '% récurrent', 'Churn clients', 'Nb clients'],
    requiredDataComplete: [
      'Durée moyenne contrat',
      "Coût acquisition client",
      'Masse salariale',
      'Turnover salariés',
    ],
  },

  // ── COMMERCE / INDUSTRIE ──────────────────────────────────────────────────

  commerce_retail: {
    id: 'commerce_retail',
    name: 'Commerce physique / Retail',
    icon: '🏬',
    color: '#E84393',
    primaryMethod: "Multiple d'EBITDA + ANR fonds de commerce",
    secondaryMethod: 'ANR (Actif Net Réévalué)',
    metricBase: 'EBITDA (+ valeur fonds de commerce)',
    whyThisMethod:
      "Un commerce physique combine la rentabilité d'exploitation (EBITDA, 3x–6x) avec la valeur de son fonds de commerce (droit au bail, emplacement, clientèle). Le fonds de commerce est un actif séparé à évaluer indépendamment de l'exploitation.",
    commonMistakes: [
      {
        mistake: "Ne pas évaluer le fonds de commerce séparément",
        impact: 'Le droit au bail peut valoir plus que l\'exploitation elle-même',
        icon: '🏠',
      },
      {
        mistake: 'Surévaluer des stocks invendables',
        impact: 'Stocks à valoriser au prix de liquidation, pas au prix d\'achat',
        icon: '📦',
      },
      {
        mistake: 'Ignorer la durée restante du bail',
        impact: 'Un bail précaire réduit considérablement la valeur',
        icon: '📅',
      },
    ],
    keyFactors: [
      { factor: 'Emplacements premium', impact: 'Fonds de commerce valorisé', direction: 'up' },
      { factor: 'Multi-sites', impact: 'Diversification du risque', direction: 'up' },
      { factor: 'Marque propre', impact: 'Clientèle attachée à l\'enseigne', direction: 'up' },
      { factor: 'E-commerce complémentaire', impact: 'Canal de vente additionnel', direction: 'up' },
      { factor: 'Bail précaire', impact: 'Risque de perte d\'emplacement', direction: 'down' },
      { factor: 'Mono-point de vente', impact: 'Concentration du risque', direction: 'down' },
      { factor: 'Zone en déclin', impact: 'Baisse de fréquentation', direction: 'down' },
      { factor: 'Pas de digital', impact: 'Retard concurrentiel', direction: 'down' },
    ],
    reportIncludes: [
      'Valorisation EBITDA + fonds de commerce',
      'Évaluation du droit au bail',
      'Analyse du CA par m²',
      'Valorisation des stocks',
      'Analyse zone de chalandise',
      'Comparables commerces similaires',
    ],
    requiredDataFlash: ['CA', 'EBITDA', 'Nb points de vente', 'Valeur fonds de commerce'],
    requiredDataComplete: [
      'Loyers / baux',
      'Ancienneté baux',
      'CA/m²',
      'Stocks',
      'Zone de chalandise',
    ],
  },

  commerce_gros: {
    id: 'commerce_gros',
    name: 'Commerce de Gros / Distribution',
    icon: '📦',
    color: '#D63031',
    primaryMethod: "Multiple d'EBITDA (prudent)",
    secondaryMethod: 'Multiple de CA en validation',
    metricBase: 'EBITDA retraité',
    whyThisMethod:
      "Le commerce de gros opère avec des marges structurellement fines (2–5 % d'EBITDA) sur des volumes élevés. Le multiple d'EBITDA (3x–4x) est bas car la valeur ajoutée est limitée et la dépendance aux fournisseurs/clients est forte. Le CA sert de cross-check (0.2x–0.6x).",
    commonMistakes: [
      {
        mistake: 'Confondre CA brut et marge commerciale',
        impact: 'Le CA de 15M€ masque une marge de 4% — la rentabilité réelle est très faible',
        icon: '📊',
      },
      {
        mistake: 'Ignorer la concentration fournisseur',
        impact: 'Si 1–2 fournisseurs représentent > 50% des achats, risque de rupture majeur',
        icon: '🏭',
      },
      {
        mistake: 'Ne pas provisionner les stocks obsolètes',
        impact: 'Stocks à rotation lente = passif caché (valoriser au prix de liquidation)',
        icon: '📦',
      },
    ],
    keyFactors: [
      { factor: 'Contrats exclusifs fournisseurs', impact: 'Barrière à l\'entrée forte', direction: 'up' },
      { factor: 'Base clients récurrente', impact: 'Prédictibilité du CA', direction: 'up' },
      { factor: 'Logistique propriétaire', impact: 'Avantage coût sur la distribution', direction: 'up' },
      { factor: 'Multi-gamme / multi-marques', impact: 'Diversification du risque', direction: 'up' },
      { factor: 'Concentration client > 50%', impact: 'Risque de perte brutale du CA', direction: 'down' },
      { factor: 'Marge nette < 2%', impact: 'Vulnérabilité à tout choc de coûts', direction: 'down' },
      { factor: 'Stocks à rotation lente', impact: 'Capital immobilisé improductif', direction: 'down' },
      { factor: 'Pression prix des centrales d\'achat', impact: 'Érosion continue des marges', direction: 'down' },
    ],
    reportIncludes: [
      'Valorisation EBITDA retraité (prudent)',
      'Analyse de la marge commerciale et tendance',
      'Répartition CA par client et concentration',
      'Analyse des contrats fournisseurs',
      'Valorisation des stocks (rotation, obsolescence)',
      'Comparables transactions distribution/gros',
    ],
    requiredDataFlash: ['CA', 'EBITDA', 'Marge commerciale', 'Top clients'],
    requiredDataComplete: [
      'Répartition fournisseurs',
      'Rotation des stocks',
      'Contrats exclusifs',
      'Carnet de commandes',
    ],
  },

  industrie: {
    id: 'industrie',
    name: 'Industrie / Manufacturing',
    icon: '🏭',
    color: '#636E72',
    primaryMethod: "Multiple d'EBITDA",
    secondaryMethod: 'ANR (terrains, machines, IP)',
    metricBase: 'EBITDA normalisé',
    whyThisMethod:
      "L'industrie se valorise principalement sur l'EBITDA (4x–7x), car c'est la capacité de production qui génère de la valeur. L'ANR (actifs corporels) sert de plancher. Attention : il faut distinguer le capex de maintenance du capex de croissance.",
    commonMistakes: [
      {
        mistake: 'Confondre capex de maintenance et capex de croissance',
        impact: "Le capex de maintenance réduit le free cash-flow réel",
        icon: '🔧',
      },
      {
        mistake: 'Ignorer les provisions environnementales',
        impact: 'Passif caché pouvant représenter des centaines de K€',
        icon: '🌍',
      },
      {
        mistake: 'Ne pas retraiter les loyers (IFRS 16)',
        impact: "L'EBITDA est artificiellement gonflé si les loyers ne sont pas comptabilisés",
        icon: '📋',
      },
    ],
    keyFactors: [
      { factor: 'Carnet de commandes plein', impact: 'Visibilité sur le CA futur', direction: 'up' },
      { factor: 'Actifs récents / amortis', impact: 'Capex de remplacement faible', direction: 'up' },
      { factor: 'Clients diversifiés', impact: 'Pas de dépendance', direction: 'up' },
      { factor: 'Certifications / normes', impact: 'Barrière à l\'entrée', direction: 'up' },
      { factor: 'Capex de remplacement élevé', impact: 'Cash-flow réel réduit', direction: 'down' },
      { factor: 'Dépendance 1–2 clients', impact: 'Risque de perte brutale de CA', direction: 'down' },
      { factor: 'Normes environnementales', impact: 'Investissements de mise en conformité', direction: 'down' },
      { factor: 'Obsolescence équipements', impact: 'Investissement lourd à prévoir', direction: 'down' },
    ],
    reportIncludes: [
      "Valorisation EBITDA avec analyse capex",
      'ANR des actifs corporels',
      'Analyse carnet de commandes',
      'Répartition clients et concentration',
      'Bilan des certifications et normes',
      'Comparables transactions industrielles',
    ],
    requiredDataFlash: ['CA', 'EBITDA', 'Valeur actifs (machines)', 'Capex annuel'],
    requiredDataComplete: [
      'Carnet de commandes',
      '% client principal',
      'Certifications',
      'Provisions environnement',
    ],
  },

  // ── PATRIMOINE / IMMOBILIER ───────────────────────────────────────────────

  patrimoine: {
    id: 'patrimoine',
    name: 'Société patrimoniale / Holding',
    icon: '🏛️',
    color: '#2D3436',
    primaryMethod: 'ANR (Actif Net Réévalué)',
    secondaryMethod: 'Rendement locatif (capitalisation des loyers)',
    metricBase: 'Valeur de marché des actifs',
    whyThisMethod:
      "Quand les revenus sont principalement locatifs et l'activité opérationnelle est faible, c'est la valeur des actifs qui prime. L'ANR (actifs réévalués - dettes) avec une décote holding de 15–30 % est la méthode standard. Ne jamais utiliser un multiple d'EBITDA.",
    commonMistakes: [
      {
        mistake: "Utiliser un multiple d'EBITDA sur une société patrimoniale",
        impact: 'Résultat absurde — les loyers ne reflètent pas la valeur des actifs',
        icon: '🚫',
      },
      {
        mistake: 'Oublier la décote holding',
        impact: 'Décote de 15–30 % systématique pour illiquidité et structure',
        icon: '📉',
      },
      {
        mistake: 'Ne pas réévaluer chaque actif individuellement',
        impact: 'La valeur comptable peut être très éloignée de la valeur de marché',
        icon: '🏠',
      },
    ],
    keyFactors: [
      { factor: 'Actifs prime (Paris, Lyon)', impact: 'Valorisation élevée et liquide', direction: 'up' },
      { factor: "Taux d'occupation > 95 %", impact: 'Revenus maximisés', direction: 'up' },
      { factor: 'Baux longs / fermes', impact: 'Visibilité sur les revenus', direction: 'up' },
      { factor: 'Plus-values latentes', impact: 'Potentiel de valorisation supplémentaire', direction: 'up' },
      { factor: 'Vacance locative', impact: 'Revenus réduits', direction: 'down' },
      { factor: 'Travaux à prévoir', impact: 'Passif caché', direction: 'down' },
      { factor: 'Endettement élevé', impact: 'ANR réduit', direction: 'down' },
      { factor: 'Actifs illiquides', impact: 'Décote de liquidité supplémentaire', direction: 'down' },
    ],
    reportIncludes: [
      'ANR détaillé actif par actif',
      'Rendement locatif et taux d\'occupation',
      'Analyse des baux en cours',
      'Plus-values latentes',
      'Décote holding appliquée',
      'Comparables immobiliers',
    ],
    requiredDataFlash: ['Valeur actifs', 'Revenus locatifs', 'Endettement'],
    requiredDataComplete: [
      "Taux d'occupation",
      'Durée baux',
      'État des actifs',
      'Plus-values latentes',
      'Travaux prévus',
    ],
  },

  patrimoine_dominant: {
    id: 'patrimoine_dominant',
    name: 'Patrimoine dominant / Peu de revenus',
    icon: '🏰',
    color: '#B2BEC3',
    primaryMethod: 'ANR (approche patrimoniale)',
    secondaryMethod: "Valeur d'usage (rendement potentiel des actifs)",
    metricBase: 'Valeur des actifs nets de dettes',
    whyThisMethod:
      "Quand les actifs représentent plus de 5x le CA annuel, la valorisation ne peut pas être basée sur les revenus. L'ANR avec décote de liquidité (15–40 %) est la seule approche fiable. Une expertise immobilière est souvent nécessaire.",
    commonMistakes: [
      {
        mistake: 'Baser la valorisation sur le CA',
        impact: 'Le CA est insignifiant par rapport à la valeur des actifs',
        icon: '🚫',
      },
      {
        mistake: "Ne pas faire d'expertise immobilière",
        impact: 'Risque de sur- ou sous-évaluation majeure',
        icon: '📐',
      },
      {
        mistake: 'Confondre valeur patrimoniale et valeur d\'exploitation',
        impact: 'Ce sont deux valorisations distinctes à additionner avec précaution',
        icon: '⚖️',
      },
    ],
    keyFactors: [
      { factor: 'Actifs facilement valorisables', impact: 'ANR fiable', direction: 'up' },
      { factor: 'Potentiel de développement', impact: 'Upside sur les actifs', direction: 'up' },
      { factor: 'Localisation premium', impact: 'Demande forte', direction: 'up' },
      { factor: 'Pas de dette', impact: 'ANR = valeur brute des actifs', direction: 'up' },
      { factor: 'Actifs très spécifiques', impact: 'Marché secondaire limité', direction: 'down' },
      { factor: "Coûts d'entretien élevés", impact: 'Cash-flow négatif', direction: 'down' },
      { factor: 'Charges fixes vs revenus', impact: 'Exploitation déficitaire', direction: 'down' },
      { factor: 'Endettement sur actifs', impact: 'ANR réduit, risque de saisie', direction: 'down' },
    ],
    reportIncludes: [
      'ANR détaillé avec expertise',
      "Valeur d'usage potentielle",
      "Analyse des coûts d'entretien",
      'Décote de liquidité appliquée',
      'Potentiel de développement des actifs',
      'Recommandation : expertise immobilière',
    ],
    requiredDataFlash: ['Valeur actifs', 'CA', 'EBITDA', 'Ratio actifs/CA'],
    requiredDataComplete: [
      'Expertise immobilière',
      'Rendement potentiel',
      "Coûts d'entretien",
      'Potentiel de développement',
    ],
  },

  // ── PROFILS ATYPIQUES ─────────────────────────────────────────────────────

  deficit_structurel: {
    id: 'deficit_structurel',
    name: 'Gros CA, déficit structurel',
    icon: '🔴',
    color: '#D63031',
    primaryMethod: 'Multiple de CA avec forte décote',
    secondaryMethod: 'Valeur de liquidation (plancher)',
    metricBase: 'CA',
    whyThisMethod:
      "Avec un EBITDA négatif depuis plus de 2 ans et une croissance faible, le multiple d'EBITDA est inapplicable. Le CA (0.3x–1.5x) avec forte décote reflète la valeur résiduelle du business. La valeur de liquidation fixe le plancher.",
    commonMistakes: [
      {
        mistake: "Valoriser sur un business plan optimiste sans preuve",
        impact: 'Sans plan crédible de retour à la rentabilité, valo = liquidation',
        icon: '📊',
      },
      {
        mistake: 'Ignorer la base clients comme actif séparé',
        impact: 'La base clients peut avoir plus de valeur que l\'exploitation',
        icon: '👥',
      },
      {
        mistake: 'Ne pas distinguer acheteur stratégique vs financier',
        impact: 'Un stratégique peut payer 2–3x plus grâce aux synergies',
        icon: '🎯',
      },
    ],
    keyFactors: [
      { factor: 'Base clients large', impact: 'Actif valorisable séparément', direction: 'up' },
      { factor: 'Marque reconnue', impact: 'Potentiel de repositionnement', direction: 'up' },
      { factor: 'Possibilité restructuration', impact: 'Retour à la rentabilité plausible', direction: 'up' },
      { factor: 'IP ou techno valorisable', impact: 'Actif intangible séparable', direction: 'up' },
      { factor: 'Déficit structurel (pas conjoncturel)', impact: 'Pas de perspective de redressement', direction: 'down' },
      { factor: 'Masse salariale rigide', impact: 'Coût de restructuration élevé', direction: 'down' },
      { factor: 'Pas de plan de retournement', impact: 'Valo = liquidation', direction: 'down' },
      { factor: 'Cash < 6 mois', impact: 'Urgence de cession', direction: 'down' },
    ],
    reportIncludes: [
      'Valorisation CA avec décote de déficit',
      'Valeur de liquidation (plancher)',
      'Analyse de la base clients',
      'Plan de restructuration (si disponible)',
      'Comparables entreprises en retournement',
      'Distinction acheteur stratégique vs financier',
    ],
    requiredDataFlash: ['CA', 'EBITDA (négatif)', 'Croissance', 'Masse salariale'],
    requiredDataComplete: [
      'Plan de restructuration',
      'Cash restant',
      'Base clients valorisable',
      'IP / propriété intellectuelle',
    ],
  },

  masse_salariale_lourde: {
    id: 'masse_salariale_lourde',
    name: 'Grosse masse salariale (> 60 % CA)',
    icon: '👷',
    color: '#E17055',
    primaryMethod: "Multiple d'EBITDA (très prudent)",
    secondaryMethod: 'Multiple CA (0.5x–1.5x)',
    metricBase: 'EBITDA retraité',
    whyThisMethod:
      "Quand la masse salariale dépasse 60 % du CA, la marge est structurellement faible (EBITDA < 8 %). Le multiple d'EBITDA (3x–5x) est prudent. Les engagements sociaux (retraite, prud'hommes) doivent être provisionnés comme du passif.",
    commonMistakes: [
      {
        mistake: 'Ignorer les engagements sociaux hors bilan',
        impact: 'Provisions retraite, congés, primes = passif caché significatif',
        icon: '⚖️',
      },
      {
        mistake: "Ne pas évaluer le coût de remplacement du personnel clé",
        impact: '3–6 mois de salaire par poste à pourvoir',
        icon: '👥',
      },
      {
        mistake: "Ne pas retraiter les charges sociales patronales",
        impact: "L'EBITDA peut masquer des charges sociales sous-provisionnées",
        icon: '📋',
      },
    ],
    keyFactors: [
      { factor: 'Compétences rares', impact: 'Barrière à l\'entrée', direction: 'up' },
      { factor: 'Contrats long terme', impact: 'Visibilité sur le CA', direction: 'up' },
      { factor: 'Faible turnover', impact: 'Stabilité opérationnelle', direction: 'up' },
      { factor: 'Formation / certification', impact: 'Équipe qualifiée et fidélisée', direction: 'up' },
      { factor: 'Convention collective contraignante', impact: 'Rigidité des coûts', direction: 'down' },
      { factor: 'Turnover élevé', impact: 'Coûts de recrutement récurrents', direction: 'down' },
      { factor: 'Pyramide des âges', impact: 'Risque de départs massifs', direction: 'down' },
      { factor: "Risque prud'homal", impact: 'Passif juridique', direction: 'down' },
    ],
    reportIncludes: [
      'Valorisation EBITDA retraité (prudent)',
      'Due diligence sociale complète',
      'Analyse masse salariale et pyramide des âges',
      'Engagements sociaux hors bilan',
      'Coût de remplacement du personnel clé',
      'Comparables secteur labor-intensive',
    ],
    requiredDataFlash: ['CA', 'EBITDA', 'Masse salariale', 'Effectifs'],
    requiredDataComplete: [
      'Convention collective',
      'Turnover',
      'Pyramide des âges',
      'Engagements sociaux',
      "Prud'hommes en cours",
    ],
  },

  micro_solo: {
    id: 'micro_solo',
    name: 'Micro-entreprise / Solo',
    icon: '👤',
    color: '#74B9FF',
    primaryMethod: 'Multiple de bénéfice net retraité',
    secondaryMethod: 'Barème fiscal (Administration Fiscale)',
    metricBase: 'Bénéfice net + rémunération dirigeant - salaire marché',
    whyThisMethod:
      "Pour une micro-entreprise (CA < 500 K€, 0–2 salariés), la valeur est le bénéfice retraité (dirigeant remplacé au salaire du marché) multiplié par 1x–3x. Le barème fiscal sert de plancher. L'earn-out est quasi systématique.",
    commonMistakes: [
      {
        mistake: "Ne pas retraiter la rémunération du dirigeant",
        impact: "Le bénéfice affiché n'a aucun sens si le dirigeant se verse 0 € ou trop",
        icon: '💰',
      },
      {
        mistake: 'Surévaluer une activité intuitu personae',
        impact: 'Si les clients viennent pour le dirigeant, valeur ≈ 0 sans lui',
        icon: '👤',
      },
      {
        mistake: "Ignorer l'accompagnement du cédant",
        impact: 'Sans transition 6–12 mois, perte de clientèle probable',
        icon: '🤝',
      },
    ],
    keyFactors: [
      { factor: 'Clientèle fidélisée', impact: 'Fichier clients transmissible', direction: 'up' },
      { factor: 'Process transférables', impact: "L'activité fonctionne sans le fondateur", direction: 'up' },
      { factor: 'Emplacement (si physique)', impact: 'Valeur du fonds de commerce', direction: 'up' },
      { factor: 'Fichier clients qualifié', impact: 'Base exploitable par le repreneur', direction: 'up' },
      { factor: 'Intuitu personae total', impact: 'Valeur quasi nulle sans le fondateur', direction: 'down' },
      { factor: 'Pas de contrats écrits', impact: 'Aucune garantie de CA futur', direction: 'down' },
      { factor: 'Compétences non transférables', impact: 'Activité meurt avec le cédant', direction: 'down' },
      { factor: 'Risque de perte clients', impact: 'Érosion post-cession', direction: 'down' },
    ],
    reportIncludes: [
      'Valorisation bénéfice retraité',
      'Barème fiscal de référence',
      'Analyse de la transférabilité',
      'Fichier clients et fidélisation',
      "Structure d'earn-out recommandée",
      'Plan d\'accompagnement cédant',
    ],
    requiredDataFlash: ['CA', 'Bénéfice net', 'Rémunération dirigeant'],
    requiredDataComplete: [
      'Fichier clients',
      "Ancienneté de l'activité",
      'Process documentés',
      'Transférabilité',
    ],
  },

  pre_revenue: {
    id: 'pre_revenue',
    name: 'Pre-revenue / Deep Tech',
    icon: '🔬',
    color: '#8E44AD',
    primaryMethod: 'DCF sur business plan + valorisation IP',
    secondaryMethod: 'Méthode VC (valorisation post-money visée)',
    metricBase: 'Projections (business plan)',
    whyThisMethod:
      "Sans CA (ou < 100 K€), les multiples de marché sont inapplicables. Le DCF sur business plan (fortement décôté) et la méthode VC (valorisation cible ÷ dilution) sont les seules approches. Les brevets et l'IP ajoutent de la valeur tangible.",
    commonMistakes: [
      {
        mistake: 'Appliquer des multiples de marché sans CA',
        impact: 'Résultat nul ou absurde',
        icon: '🚫',
      },
      {
        mistake: "Faire confiance au business plan sans validation marché",
        impact: "Un business plan pre-revenue est une fiction jusqu'à preuve du contraire",
        icon: '📊',
      },
      {
        mistake: 'Ignorer la méthode Berkus pour les très early stage',
        impact: 'Berkus (seed/pre-seed) valorise l\'équipe, l\'IP, le marché séparément',
        icon: '🧮',
      },
    ],
    keyFactors: [
      { factor: 'Brevets déposés', impact: 'IP tangible et défendable', direction: 'up' },
      { factor: 'Équipe de haut niveau', impact: "Capacité d'exécution", direction: 'up' },
      { factor: 'Marché adressable énorme', impact: 'Potentiel de scale', direction: 'up' },
      { factor: "Premiers POC / lettres d'intention", impact: 'Validation marché partielle', direction: 'up' },
      { factor: 'Pas de validation marché', impact: 'Risque maximal', direction: 'down' },
      { factor: 'Risque techno élevé', impact: 'Le produit peut ne jamais fonctionner', direction: 'down' },
      { factor: 'Time-to-market long', impact: 'Cash burn prolongé', direction: 'down' },
      { factor: 'Besoin de financement massif', impact: 'Dilution importante à prévoir', direction: 'down' },
    ],
    reportIncludes: [
      'Valorisation DCF sur business plan',
      'Méthode VC (scénarios de sortie)',
      'Valorisation IP / brevets',
      "Analyse de l'équipe fondatrice",
      'TAM / SAM / SOM',
      'Avertissement : valorisation non standard — consulter un expert',
    ],
    requiredDataFlash: ['Dépenses R&D', 'Cash disponible', 'Brevets', 'Business plan'],
    requiredDataComplete: [
      'Équipe (CV)',
      "LOI / POC",
      'TAM / SAM / SOM',
      'Roadmap produit',
      'Besoins de financement',
    ],
  },
} as const satisfies Record<string, Archetype>

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

export const ARCHETYPE_IDS = Object.keys(ARCHETYPES) as (keyof typeof ARCHETYPES)[]

export function getArchetype(id: string): Archetype | undefined {
  return ARCHETYPES[id]
}

export function getAllArchetypes(): Archetype[] {
  return Object.values(ARCHETYPES)
}

// -----------------------------------------------------------------------------
// Diagnostic Input & Routing
// -----------------------------------------------------------------------------

export interface DiagnosticInput {
  sector: string
  revenue: number
  ebitda: number
  growth: number
  recurring: number
  masseSalariale: number
  hasPhysicalStore?: boolean
  hasMRR?: boolean
  nafCode?: string
  remunerationDirigeant?: number
  concentrationClient?: number
  mrrMensuel?: number
}

// ---------------------------------------------------------------------------
// Sector matching helpers
// ---------------------------------------------------------------------------

const CONSEIL_KEYWORDS = [
  'conseil', 'consulting', 'esn', 'expert-comptable', 'comptable',
  'avocat', 'architecte', 'communication', 'formation', 'audit',
  'agence immobilière', 'agence web', "bureau d'études",
]

const COMMERCE_KEYWORDS = [
  'commerce', 'retail', 'restaurant', 'boulangerie', 'pharmacie',
  'coiffeur', 'esthétique', 'garage', 'fleuriste', 'opticien',
  'caviste', 'vétérinaire', 'auto-école', 'hôtel', 'hôtellerie',
  'hébergement', 'location', 'luxe', 'bar', 'café', 'pressing',
  'tabac',
]

const INDUSTRIE_KEYWORDS = [
  'industrie', 'manufacturing', 'btp', 'transport', 'logistique',
  'agroalimentaire', 'imprimerie', 'menuiserie', 'extraction',
  'carrière', 'mine', 'usine', 'métallurgie', 'chimie',
  'plasturgie', 'textile', 'énergie',
]

function matchSector(s: string, keywords: string[]): boolean {
  // Exact match
  if (keywords.includes(s)) return true
  // Prefix match : "agence de com" matches if "agence" is a prefix keyword
  if (s.startsWith('agence') || s.startsWith('cabinet')) {
    return keywords.some(k => k.startsWith('agence') || k.startsWith('cabinet'))
  }
  return false
}

function isSectorConseil(s: string): boolean {
  return matchSector(s, CONSEIL_KEYWORDS)
}

function isSectorCommerce(s: string): boolean {
  return matchSector(s, COMMERCE_KEYWORDS)
}

function isSectorIndustrie(s: string): boolean {
  return INDUSTRIE_KEYWORDS.includes(s)
}

/**
 * Détecte l'archétype de valorisation adapté selon les règles de priorité P1→P6.
 * Source : /docs/ARCHETYPES.xlsx (onglet "Routing Automatique")
 *
 * Retourne l'id de l'archétype (clé de ARCHETYPES). Fallback: 'services_recurrents'.
 */
export function detectArchetype(data: DiagnosticInput): string {
  const {
    sector,
    revenue,
    ebitda,
    growth,
    recurring,
    masseSalariale,
    hasPhysicalStore = false,
    hasMRR = false,
  } = data

  const s = sector.toLowerCase().trim()

  // ── P1 — Prioritaire ─────────────────────────────────────────────────────
  // Règle 1 : CA = 0 ou secteur explicitement pre-revenue → #15
  if (
    revenue <= 0 ||
    s === 'pre_revenue' ||
    s === 'deeptech' ||
    s === 'biotech'
  ) {
    return 'pre_revenue'
  }

  // Règle 2 : EBITDA < 0 ET Croissance > 40% ET MRR → #1
  if (ebitda < 0 && growth > 40 && hasMRR) {
    return 'saas_hyper'
  }

  // ── P2 ────────────────────────────────────────────────────────────────────
  // Règle 3+4 : Société patrimoniale / Patrimoine dominant
  //   - Revenus locatifs > 50% CA → #10 patrimoine
  //   - Sinon (actifs >> revenus) → #11 patrimoine_dominant
  //   Proxy : le champ `sector` indique une activité patrimoniale,
  //   `recurring` > 50 distingue revenus locatifs récurrents vs exploitation faible.
  if (
    s === 'patrimoine' ||
    s === 'immobilier' ||
    s === 'holding' ||
    s === 'sci' ||
    s === 'fonciere'
  ) {
    return recurring > 50 ? 'patrimoine' : 'patrimoine_dominant'
  }

  // Règle 5 : CA < 300K€ → #14 Micro-entreprise / Solo
  // SAUF marketplace (dynamiques différentes à faible CA)
  // Note : les SaaS hyper-croissance (P1) sont déjà capturés avant
  if (revenue < 300_000 && s !== 'marketplace') {
    return 'micro_solo'
  }

  // ── P3 ────────────────────────────────────────────────────────────────────
  // Règle 6 : EBITDA < 0 ET Croissance < 20% ET CA > 1M€ → #12
  if (ebitda < 0 && growth < 20 && revenue > 1_000_000) {
    return 'deficit_structurel'
  }

  // Règle 7 : Masse salariale / CA > 60% → #13
  // SAUF si le secteur est un métier où la masse salariale élevée est structurelle
  // (restaurants, cabinets, professions libérales). Ces métiers doivent rester
  // dans leur archétype naturel (commerce_retail, conseil), pas masse_salariale.
  if (masseSalariale > 60 && !isSectorConseil(s) && !isSectorCommerce(s)) {
    return 'masse_salariale_lourde'
  }

  // ── P4 — Secteur + métriques ──────────────────────────────────────────────
  // Règle 8 : MRR + Récurrence > 80% + Croissance > 40% → #1
  if (hasMRR && recurring > 80 && growth > 40) {
    return 'saas_hyper'
  }

  // Règle 9 : MRR + Récurrence > 80% + Croissance 5–40% → #2
  if (hasMRR && recurring > 80 && growth >= 5) {
    return 'saas_mature'
  }

  // Règle 10 : MRR + Récurrence > 60% + Croissance < 5% → #3
  if (hasMRR && recurring > 60 && growth < 5) {
    return 'saas_decline'
  }

  // Règle 10b : SaaS déclaré (sector=saas) avec hasMRR mais récurrence < 60%
  // L'utilisateur a choisi "SaaS / Logiciel" — on route selon la croissance
  if (s === 'saas' && hasMRR) {
    if (growth > 40) return 'saas_hyper'
    if (growth >= 5) return 'saas_mature'
    return 'saas_decline'
  }

  // Règle 11 : Marketplace → #4
  if (s === 'marketplace') {
    return 'marketplace'
  }

  // Règle 12 : E-commerce → #5
  if (s === 'ecommerce' || s === 'e-commerce' || s === 'd2c') {
    return 'ecommerce'
  }

  // ── P5 — Secteur classique ────────────────────────────────────────────────
  // Règle 13 : Conseil / services intellectuels → #6
  if (isSectorConseil(s)) {
    return 'conseil'
  }

  // Règle 14 : Récurrence > 60% + service physique → #7
  if (recurring > 60) {
    return 'services_recurrents'
  }

  // Règle 14b : Commerce de gros (NAF 46.xx) → commerce_gros
  if (data.nafCode && data.nafCode.startsWith('46')) {
    return 'commerce_gros'
  }

  // Règle 15 : Commerce physique / PDV → #8
  if (hasPhysicalStore || isSectorCommerce(s)) {
    return 'commerce_retail'
  }

  // Règle 16 : Industrie / manufacturing → #9
  if (isSectorIndustrie(s)) {
    return 'industrie'
  }

  // Règle 17 : Services non-capturés → #7
  // L'utilisateur a choisi "Services récurrents" dans le formulaire
  if (s === 'services') {
    return 'services_recurrents'
  }

  // ── P6 — Fallback ────────────────────────────────────────────────────────
  // Secteur inconnu ou sans métriques distinctives → conseil (catchall)
  return 'conseil'
}
