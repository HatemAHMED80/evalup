// Mapping des codes NAF (INSEE) vers les secteurs EvalUp

// Table de correspondance code NAF → code secteur EvalUp
const NAF_TO_SECTEUR: Record<string, string> = {
  // Tech / SaaS (62.xx - Programmation, conseil informatique)
  '62.01Z': 'tech-saas',
  '62.02A': 'tech-saas',
  '62.02B': 'tech-saas',
  '62.03Z': 'tech-saas',
  '62.09Z': 'tech-saas',
  '63.11Z': 'tech-saas', // Traitement de données, hébergement
  '63.12Z': 'tech-saas', // Portails Internet
  '58.21Z': 'tech-saas', // Édition de jeux électroniques
  '58.29A': 'tech-saas', // Édition de logiciels système
  '58.29B': 'tech-saas', // Édition de logiciels applicatifs
  '58.29C': 'tech-saas', // Édition de logiciels de jeux

  // E-commerce (47.91x - Vente à distance)
  '47.91A': 'ecommerce',
  '47.91B': 'ecommerce',
  '47.99A': 'ecommerce',
  '47.99B': 'ecommerce',

  // Services B2B (70.xx, 73.xx - Conseil, publicité)
  '70.10Z': 'services-b2b', // Activités des sièges sociaux
  '70.21Z': 'consulting',   // Conseil en relations publiques
  '70.22Z': 'consulting',   // Conseil de gestion
  '73.11Z': 'services-b2b', // Activités des agences de publicité
  '73.12Z': 'services-b2b', // Régie publicitaire
  '73.20Z': 'services-b2b', // Études de marché
  '74.10Z': 'services-b2b', // Activités spécialisées de design
  '74.20Z': 'services-b2b', // Activités photographiques
  '74.30Z': 'services-b2b', // Traduction et interprétation
  '74.90A': 'services-b2b', // Activité des économistes de la construction
  '74.90B': 'services-b2b', // Activités spécialisées diverses

  // Commerce de détail (47.xx sauf e-commerce)
  '47.11A': 'commerce-detail',
  '47.11B': 'commerce-detail',
  '47.11C': 'commerce-detail',
  '47.11D': 'commerce-detail',
  '47.11E': 'commerce-detail',
  '47.11F': 'commerce-detail',
  '47.19A': 'commerce-detail',
  '47.19B': 'commerce-detail',
  '47.21Z': 'commerce-detail',
  '47.22Z': 'commerce-detail',
  '47.23Z': 'commerce-detail',
  '47.24Z': 'commerce-detail',
  '47.25Z': 'commerce-detail',
  '47.26Z': 'commerce-detail',
  '47.29Z': 'commerce-detail',
  '47.30Z': 'commerce-detail',
  '47.41Z': 'commerce-detail',
  '47.42Z': 'commerce-detail',
  '47.43Z': 'commerce-detail',
  '47.51Z': 'commerce-detail',
  '47.52A': 'commerce-detail',
  '47.52B': 'commerce-detail',
  '47.53Z': 'commerce-detail',
  '47.54Z': 'commerce-detail',
  '47.59A': 'commerce-detail',
  '47.59B': 'commerce-detail',
  '47.61Z': 'commerce-detail',
  '47.62Z': 'commerce-detail',
  '47.63Z': 'commerce-detail',
  '47.64Z': 'commerce-detail',
  '47.65Z': 'commerce-detail',
  '47.71Z': 'commerce-detail',
  '47.72A': 'commerce-detail',
  '47.72B': 'commerce-detail',
  '47.73Z': 'sante', // Pharmacies
  '47.74Z': 'commerce-detail',
  '47.75Z': 'commerce-detail',
  '47.76Z': 'commerce-detail',
  '47.77Z': 'commerce-detail',
  '47.78A': 'commerce-detail',
  '47.78B': 'commerce-detail',
  '47.78C': 'commerce-detail',
  '47.79Z': 'commerce-detail',
  '47.81Z': 'commerce-detail',
  '47.82Z': 'commerce-detail',
  '47.89Z': 'commerce-detail',

  // Restauration (56.xx)
  '56.10A': 'restauration', // Restauration traditionnelle
  '56.10B': 'restauration', // Cafétérias
  '56.10C': 'restauration', // Restauration rapide
  '56.21Z': 'restauration', // Services des traiteurs
  '56.29A': 'restauration', // Restauration collective
  '56.29B': 'restauration', // Autres services de restauration
  '56.30Z': 'restauration', // Débits de boissons

  // Industrie (10.xx à 33.xx)
  '10.11Z': 'industrie', '10.12Z': 'industrie', '10.13A': 'industrie',
  '10.20Z': 'industrie', '10.31Z': 'industrie', '10.32Z': 'industrie',
  '10.39A': 'industrie', '10.39B': 'industrie', '10.41A': 'industrie',
  '10.41B': 'industrie', '10.42Z': 'industrie', '10.51A': 'industrie',
  '10.51B': 'industrie', '10.51C': 'industrie', '10.51D': 'industrie',
  '10.52Z': 'industrie', '10.61A': 'industrie', '10.61B': 'industrie',
  '10.62Z': 'industrie', '10.71A': 'industrie', '10.71B': 'industrie',
  '10.71C': 'industrie', '10.71D': 'industrie', '10.72Z': 'industrie',
  '10.73Z': 'industrie', '10.81Z': 'industrie', '10.82Z': 'industrie',
  '10.83Z': 'industrie', '10.84Z': 'industrie', '10.85Z': 'industrie',
  '10.86Z': 'industrie', '10.89Z': 'industrie', '10.91Z': 'industrie',
  '10.92Z': 'industrie',
  '20.11Z': 'industrie', '20.12Z': 'industrie', '20.13A': 'industrie',
  '20.13B': 'industrie', '20.14Z': 'industrie', '20.15Z': 'industrie',
  '20.16Z': 'industrie', '20.17Z': 'industrie', '20.20Z': 'industrie',
  '20.30Z': 'industrie', '20.41Z': 'industrie', '20.42Z': 'industrie',
  '20.51Z': 'industrie', '20.52Z': 'industrie', '20.53Z': 'industrie',
  '20.59Z': 'industrie', '20.60Z': 'industrie',
  '22.11Z': 'industrie', '22.19Z': 'industrie', '22.21Z': 'industrie',
  '22.22Z': 'industrie', '22.23Z': 'industrie', '22.29A': 'industrie',
  '22.29B': 'industrie',
  '25.11Z': 'industrie', '25.12Z': 'industrie', '25.21Z': 'industrie',
  '25.29Z': 'industrie', '25.30Z': 'industrie', '25.40Z': 'industrie',
  '25.50A': 'industrie', '25.50B': 'industrie', '25.61Z': 'industrie',
  '25.62A': 'industrie', '25.62B': 'industrie', '25.71Z': 'industrie',
  '25.72Z': 'industrie', '25.73A': 'industrie', '25.73B': 'industrie',
  '25.91Z': 'industrie', '25.92Z': 'industrie', '25.93Z': 'industrie',
  '25.94Z': 'industrie', '25.99A': 'industrie', '25.99B': 'industrie',

  // Santé (86.xx)
  '86.10Z': 'sante', // Activités hospitalières
  '86.21Z': 'sante', // Activité des médecins généralistes
  '86.22A': 'sante', // Activités de radiodiagnostic et radiothérapie
  '86.22B': 'sante', // Activités chirurgicales
  '86.22C': 'sante', // Autres activités des médecins spécialistes
  '86.23Z': 'sante', // Pratique dentaire
  '86.90A': 'sante', // Ambulances
  '86.90B': 'sante', // Laboratoires d'analyses médicales
  '86.90C': 'sante', // Centres de collecte et banques d'organes
  '86.90D': 'sante', // Activités des infirmiers
  '86.90E': 'sante', // Activités de rééducation
  '86.90F': 'sante', // Activités de santé humaine non classées ailleurs

  // Construction / BTP (41.xx à 43.xx)
  '41.10A': 'construction-btp', '41.10B': 'construction-btp',
  '41.20A': 'construction-btp', '41.20B': 'construction-btp',
  '42.11Z': 'construction-btp', '42.12Z': 'construction-btp',
  '42.13A': 'construction-btp', '42.13B': 'construction-btp',
  '42.21Z': 'construction-btp', '42.22Z': 'construction-btp',
  '42.91Z': 'construction-btp', '42.99Z': 'construction-btp',
  '43.11Z': 'construction-btp', '43.12A': 'construction-btp',
  '43.12B': 'construction-btp', '43.13Z': 'construction-btp',
  '43.21A': 'construction-btp', '43.21B': 'construction-btp',
  '43.22A': 'construction-btp', '43.22B': 'construction-btp',
  '43.29A': 'construction-btp', '43.29B': 'construction-btp',
  '43.31Z': 'construction-btp', '43.32A': 'construction-btp',
  '43.32B': 'construction-btp', '43.32C': 'construction-btp',
  '43.33Z': 'construction-btp', '43.34Z': 'construction-btp',
  '43.39Z': 'construction-btp', '43.91A': 'construction-btp',
  '43.91B': 'construction-btp', '43.99A': 'construction-btp',
  '43.99B': 'construction-btp', '43.99C': 'construction-btp',
  '43.99D': 'construction-btp', '43.99E': 'construction-btp',

  // Immobilier (68.xx)
  '68.10Z': 'immobilier', // Activités des marchands de biens immobiliers
  '68.20A': 'immobilier', // Location de logements
  '68.20B': 'immobilier', // Location de terrains et autres biens immobiliers
  '68.31Z': 'immobilier', // Agences immobilières
  '68.32A': 'immobilier', // Administration d'immeubles et autres biens immobiliers
  '68.32B': 'immobilier', // Supports juridiques de gestion de patrimoine immobilier

  // Transport / Logistique (49.xx à 53.xx)
  '49.10Z': 'transport-logistique', // Transport ferroviaire de voyageurs
  '49.20Z': 'transport-logistique', // Transport ferroviaire de fret
  '49.31Z': 'transport-logistique', // Transports urbains de voyageurs
  '49.32Z': 'transport-logistique', // Transports de voyageurs par taxis
  '49.39A': 'transport-logistique', // Transports routiers réguliers de voyageurs
  '49.39B': 'transport-logistique', // Autres transports routiers de voyageurs
  '49.39C': 'transport-logistique', // Téléphériques et remontées mécaniques
  '49.41A': 'transport-logistique', // Transports routiers de fret interurbains
  '49.41B': 'transport-logistique', // Transports routiers de fret de proximité
  '49.41C': 'transport-logistique', // Location de camions avec chauffeur
  '49.42Z': 'transport-logistique', // Services de déménagement
  '49.50Z': 'transport-logistique', // Transports par conduites
  '50.10Z': 'transport-logistique', // Transports maritimes
  '50.20Z': 'transport-logistique', // Transports maritimes côtiers
  '50.30Z': 'transport-logistique', // Transports fluviaux de passagers
  '50.40Z': 'transport-logistique', // Transports fluviaux de fret
  '51.10Z': 'transport-logistique', // Transports aériens de passagers
  '51.21Z': 'transport-logistique', // Transports aériens de fret
  '52.10A': 'transport-logistique', // Entreposage et stockage frigorifique
  '52.10B': 'transport-logistique', // Entreposage et stockage non frigorifique
  '52.21Z': 'transport-logistique', // Services auxiliaires des transports terrestres
  '52.22Z': 'transport-logistique', // Services auxiliaires des transports par eau
  '52.23Z': 'transport-logistique', // Services auxiliaires des transports aériens
  '52.24A': 'transport-logistique', // Manutention portuaire
  '52.24B': 'transport-logistique', // Manutention non portuaire
  '52.29A': 'transport-logistique', // Messagerie, fret express
  '52.29B': 'transport-logistique', // Affrètement et organisation des transports
  '53.10Z': 'transport-logistique', // Activités de poste
  '53.20Z': 'transport-logistique', // Autres activités de poste et de courrier

  // Éducation / Formation (85.xx)
  '85.10Z': 'education-formation', // Enseignement pré-primaire
  '85.20Z': 'education-formation', // Enseignement primaire
  '85.31Z': 'education-formation', // Enseignement secondaire général
  '85.32Z': 'education-formation', // Enseignement secondaire technique
  '85.41Z': 'education-formation', // Enseignement post-secondaire non supérieur
  '85.42Z': 'education-formation', // Enseignement supérieur
  '85.51Z': 'education-formation', // Enseignement de disciplines sportives
  '85.52Z': 'education-formation', // Enseignement culturel
  '85.53Z': 'education-formation', // Enseignement de la conduite
  '85.59A': 'education-formation', // Formation continue d'adultes
  '85.59B': 'education-formation', // Autres enseignements
  '85.60Z': 'education-formation', // Activités de soutien à l'enseignement

  // Consulting (déjà mappé dans Services B2B)
  '69.10Z': 'consulting', // Activités juridiques
  '69.20Z': 'consulting', // Activités comptables
  '71.11Z': 'consulting', // Activités d'architecture
  '71.12A': 'consulting', // Activité des géomètres
  '71.12B': 'consulting', // Ingénierie, études techniques
  '71.20A': 'consulting', // Contrôle technique automobile
  '71.20B': 'consulting', // Analyses, essais et inspections techniques
  '72.11Z': 'consulting', // R&D en biotechnologie
  '72.19Z': 'consulting', // R&D en sciences physiques et naturelles
  '72.20Z': 'consulting', // R&D en sciences humaines et sociales
}

// Fonction pour convertir un code NAF en code secteur EvalUp
export function nafToSecteur(codeNaf: string): string | null {
  // Normaliser le code (enlever les espaces, mettre en majuscule)
  const codeNormalise = codeNaf.trim().toUpperCase()

  // Recherche exacte
  if (NAF_TO_SECTEUR[codeNormalise]) {
    return NAF_TO_SECTEUR[codeNormalise]
  }

  // Recherche par préfixe (2 premiers chiffres)
  const prefixe = codeNormalise.substring(0, 2)
  const prefixeMapping: Record<string, string> = {
    '10': 'industrie', '11': 'industrie', '12': 'industrie', '13': 'industrie',
    '14': 'industrie', '15': 'industrie', '16': 'industrie', '17': 'industrie',
    '18': 'industrie', '19': 'industrie', '20': 'industrie', '21': 'industrie',
    '22': 'industrie', '23': 'industrie', '24': 'industrie', '25': 'industrie',
    '26': 'industrie', '27': 'industrie', '28': 'industrie', '29': 'industrie',
    '30': 'industrie', '31': 'industrie', '32': 'industrie', '33': 'industrie',
    '41': 'construction-btp', '42': 'construction-btp', '43': 'construction-btp',
    '45': 'commerce-detail', '46': 'commerce-detail', '47': 'commerce-detail',
    '49': 'transport-logistique', '50': 'transport-logistique', '51': 'transport-logistique',
    '52': 'transport-logistique', '53': 'transport-logistique',
    '55': 'restauration', '56': 'restauration',
    '58': 'tech-saas', '59': 'tech-saas', '60': 'tech-saas',
    '61': 'tech-saas', '62': 'tech-saas', '63': 'tech-saas',
    '64': 'services-b2b', '65': 'services-b2b', '66': 'services-b2b',
    '68': 'immobilier',
    '69': 'consulting', '70': 'consulting', '71': 'consulting',
    '72': 'consulting', '73': 'services-b2b', '74': 'services-b2b',
    '75': 'sante',
    '77': 'services-b2b', '78': 'services-b2b', '79': 'services-b2b',
    '80': 'services-b2b', '81': 'services-b2b', '82': 'services-b2b',
    '84': 'services-b2b',
    '85': 'education-formation',
    '86': 'sante', '87': 'sante', '88': 'sante',
    '90': 'services-b2b', '91': 'services-b2b', '92': 'services-b2b',
    '93': 'services-b2b', '94': 'services-b2b', '95': 'services-b2b',
    '96': 'services-b2b',
  }

  return prefixeMapping[prefixe] || null
}

// Fonction pour obtenir le libellé d'un secteur à partir du code NAF
export function getLibelleSecteurFromNaf(codeNaf: string): string | null {
  const secteurCode = nafToSecteur(codeNaf)
  if (!secteurCode) return null

  const libelles: Record<string, string> = {
    'tech-saas': 'Tech / SaaS',
    'ecommerce': 'E-commerce',
    'services-b2b': 'Services B2B',
    'commerce-detail': 'Commerce de détail',
    'restauration': 'Restauration',
    'industrie': 'Industrie',
    'sante': 'Santé',
    'construction-btp': 'Construction / BTP',
    'immobilier': 'Immobilier',
    'transport-logistique': 'Transport / Logistique',
    'education-formation': 'Éducation / Formation',
    'consulting': 'Consulting',
  }

  return libelles[secteurCode] || null
}
