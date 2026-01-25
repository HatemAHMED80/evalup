// Données des secteurs d'activité avec leurs multiples de valorisation

import { Secteur } from './types'

// Liste complète des secteurs avec leurs caractéristiques
export const SECTEURS: Secteur[] = [
  {
    nom: 'Tech / SaaS',
    code: 'tech-saas',
    multipleCA: { min: 2, max: 4 },
    multipleEBITDA: { min: 8, max: 12 },
    margeNetteMoyenne: 15,
    tauxCroissanceMoyen: 25,
  },
  {
    nom: 'E-commerce',
    code: 'ecommerce',
    multipleCA: { min: 0.5, max: 1.5 },
    multipleEBITDA: { min: 5, max: 8 },
    margeNetteMoyenne: 8,
    tauxCroissanceMoyen: 15,
  },
  {
    nom: 'Services B2B',
    code: 'services-b2b',
    multipleCA: { min: 0.5, max: 1 },
    multipleEBITDA: { min: 4, max: 6 },
    margeNetteMoyenne: 12,
    tauxCroissanceMoyen: 8,
  },
  {
    nom: 'Commerce de détail',
    code: 'commerce-detail',
    multipleCA: { min: 0.3, max: 0.5 },
    multipleEBITDA: { min: 3, max: 5 },
    margeNetteMoyenne: 5,
    tauxCroissanceMoyen: 3,
  },
  {
    nom: 'Restauration',
    code: 'restauration',
    multipleCA: { min: 0.3, max: 0.6 },
    multipleEBITDA: { min: 2, max: 4 },
    margeNetteMoyenne: 6,
    tauxCroissanceMoyen: 4,
  },
  {
    nom: 'Industrie',
    code: 'industrie',
    multipleCA: { min: 0.4, max: 0.8 },
    multipleEBITDA: { min: 4, max: 6 },
    margeNetteMoyenne: 8,
    tauxCroissanceMoyen: 5,
  },
  {
    nom: 'Santé',
    code: 'sante',
    multipleCA: { min: 0.8, max: 1.5 },
    multipleEBITDA: { min: 6, max: 10 },
    margeNetteMoyenne: 10,
    tauxCroissanceMoyen: 7,
  },
  {
    nom: 'Construction / BTP',
    code: 'construction-btp',
    multipleCA: { min: 0.2, max: 0.5 },
    multipleEBITDA: { min: 3, max: 5 },
    margeNetteMoyenne: 5,
    tauxCroissanceMoyen: 4,
  },
  {
    nom: 'Immobilier',
    code: 'immobilier',
    multipleCA: { min: 0.5, max: 1 },
    multipleEBITDA: { min: 5, max: 8 },
    margeNetteMoyenne: 15,
    tauxCroissanceMoyen: 6,
  },
  {
    nom: 'Transport / Logistique',
    code: 'transport-logistique',
    multipleCA: { min: 0.3, max: 0.6 },
    multipleEBITDA: { min: 3, max: 5 },
    margeNetteMoyenne: 6,
    tauxCroissanceMoyen: 5,
  },
  {
    nom: 'Éducation / Formation',
    code: 'education-formation',
    multipleCA: { min: 0.6, max: 1.2 },
    multipleEBITDA: { min: 4, max: 7 },
    margeNetteMoyenne: 12,
    tauxCroissanceMoyen: 8,
  },
  {
    nom: 'Consulting',
    code: 'consulting',
    multipleCA: { min: 0.5, max: 1 },
    multipleEBITDA: { min: 4, max: 6 },
    margeNetteMoyenne: 15,
    tauxCroissanceMoyen: 7,
  },
]

// Fonction pour récupérer un secteur par son code
export function getSecteurByCode(code: string): Secteur | undefined {
  return SECTEURS.find(s => s.code === code)
}

// Fonction pour récupérer un secteur par son nom
export function getSecteurByNom(nom: string): Secteur | undefined {
  return SECTEURS.find(s => s.nom === nom)
}
