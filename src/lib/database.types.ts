// Types TypeScript pour la base de données Supabase
// Générés manuellement - à synchroniser avec le schéma SQL

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      vendeurs: {
        Row: {
          id: string
          user_id: string | null
          siren: string
          nom_entreprise: string | null
          secteur_code_naf: string | null
          secteur_libelle: string | null
          adresse: string | null
          code_postal: string | null
          ville: string | null
          effectif: string | null
          date_creation: string | null
          chiffre_affaires: number | null
          ebitda: number | null
          resultat_net: number | null
          tresorerie: number | null
          dettes_financieres: number | null
          valorisation_basse: number | null
          valorisation_moyenne: number | null
          valorisation_haute: number | null
          souhaite_vendre: boolean
          visible_acheteurs: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          siren: string
          nom_entreprise?: string | null
          secteur_code_naf?: string | null
          secteur_libelle?: string | null
          adresse?: string | null
          code_postal?: string | null
          ville?: string | null
          effectif?: string | null
          date_creation?: string | null
          chiffre_affaires?: number | null
          ebitda?: number | null
          resultat_net?: number | null
          tresorerie?: number | null
          dettes_financieres?: number | null
          valorisation_basse?: number | null
          valorisation_moyenne?: number | null
          valorisation_haute?: number | null
          souhaite_vendre?: boolean
          visible_acheteurs?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          siren?: string
          nom_entreprise?: string | null
          secteur_code_naf?: string | null
          secteur_libelle?: string | null
          adresse?: string | null
          code_postal?: string | null
          ville?: string | null
          effectif?: string | null
          date_creation?: string | null
          chiffre_affaires?: number | null
          ebitda?: number | null
          resultat_net?: number | null
          tresorerie?: number | null
          dettes_financieres?: number | null
          valorisation_basse?: number | null
          valorisation_moyenne?: number | null
          valorisation_haute?: number | null
          souhaite_vendre?: boolean
          visible_acheteurs?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      acheteurs: {
        Row: {
          id: string
          user_id: string | null
          numero_acheteur: number
          prenom: string | null
          nom: string | null
          email: string | null
          telephone: string | null
          apport_personnel: number | null
          capacite_emprunt: number | null
          budget_total: number | null
          preuve_fonds_validee: boolean
          annees_experience_gestion: number | null
          secteurs_expertise: string[] | null
          a_deja_repris: boolean
          diplome: string | null
          poste_actuel: string | null
          accompagne_par: string | null
          disponibilite: string | null
          delai_reprise: string | null
          pitch: string | null
          score_total: number | null
          score_grade: string | null
          score_details: Json | null
          profil_complet: boolean
          actif: boolean
          premium: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          numero_acheteur?: number
          prenom?: string | null
          nom?: string | null
          email?: string | null
          telephone?: string | null
          apport_personnel?: number | null
          capacite_emprunt?: number | null
          budget_total?: number | null
          preuve_fonds_validee?: boolean
          annees_experience_gestion?: number | null
          secteurs_expertise?: string[] | null
          a_deja_repris?: boolean
          diplome?: string | null
          poste_actuel?: string | null
          accompagne_par?: string | null
          disponibilite?: string | null
          delai_reprise?: string | null
          pitch?: string | null
          score_total?: number | null
          score_grade?: string | null
          score_details?: Json | null
          profil_complet?: boolean
          actif?: boolean
          premium?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          numero_acheteur?: number
          prenom?: string | null
          nom?: string | null
          email?: string | null
          telephone?: string | null
          apport_personnel?: number | null
          capacite_emprunt?: number | null
          budget_total?: number | null
          preuve_fonds_validee?: boolean
          annees_experience_gestion?: number | null
          secteurs_expertise?: string[] | null
          a_deja_repris?: boolean
          diplome?: string | null
          poste_actuel?: string | null
          accompagne_par?: string | null
          disponibilite?: string | null
          delai_reprise?: string | null
          pitch?: string | null
          score_total?: number | null
          score_grade?: string | null
          score_details?: Json | null
          profil_complet?: boolean
          actif?: boolean
          premium?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      criteres_recherche: {
        Row: {
          id: string
          acheteur_id: string
          secteurs_souhaites: string[] | null
          secteurs_exclus: string[] | null
          ca_min: number | null
          ca_max: number | null
          resultat_min: number | null
          resultat_max: number | null
          effectif_min: number | null
          effectif_max: number | null
          anciennete_min: number | null
          regions: string[] | null
          departements: string[] | null
          rayon_km: number | null
          ville_centre: string | null
          accepte_relocalisation: boolean
          prix_max: number | null
          apport_disponible: number | null
          type_reprise: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          acheteur_id: string
          secteurs_souhaites?: string[] | null
          secteurs_exclus?: string[] | null
          ca_min?: number | null
          ca_max?: number | null
          resultat_min?: number | null
          resultat_max?: number | null
          effectif_min?: number | null
          effectif_max?: number | null
          anciennete_min?: number | null
          regions?: string[] | null
          departements?: string[] | null
          rayon_km?: number | null
          ville_centre?: string | null
          accepte_relocalisation?: boolean
          prix_max?: number | null
          apport_disponible?: number | null
          type_reprise?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          acheteur_id?: string
          secteurs_souhaites?: string[] | null
          secteurs_exclus?: string[] | null
          ca_min?: number | null
          ca_max?: number | null
          resultat_min?: number | null
          resultat_max?: number | null
          effectif_min?: number | null
          effectif_max?: number | null
          anciennete_min?: number | null
          regions?: string[] | null
          departements?: string[] | null
          rayon_km?: number | null
          ville_centre?: string | null
          accepte_relocalisation?: boolean
          prix_max?: number | null
          apport_disponible?: number | null
          type_reprise?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      matchings: {
        Row: {
          id: string
          vendeur_id: string
          acheteur_id: string
          score_matching: number | null
          vu_par_vendeur: boolean
          accepte_par_vendeur: boolean | null
          date_decision_vendeur: string | null
          vu_par_acheteur: boolean
          interesse_acheteur: boolean
          contact_autorise: boolean
          date_mise_en_contact: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendeur_id: string
          acheteur_id: string
          score_matching?: number | null
          vu_par_vendeur?: boolean
          accepte_par_vendeur?: boolean | null
          date_decision_vendeur?: string | null
          vu_par_acheteur?: boolean
          interesse_acheteur?: boolean
          contact_autorise?: boolean
          date_mise_en_contact?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendeur_id?: string
          acheteur_id?: string
          score_matching?: number | null
          vu_par_vendeur?: boolean
          accepte_par_vendeur?: boolean | null
          date_decision_vendeur?: string | null
          vu_par_acheteur?: boolean
          interesse_acheteur?: boolean
          contact_autorise?: boolean
          date_mise_en_contact?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Types utilitaires pour l'application
export type Vendeur = Database['public']['Tables']['vendeurs']['Row']
export type VendeurInsert = Database['public']['Tables']['vendeurs']['Insert']
export type VendeurUpdate = Database['public']['Tables']['vendeurs']['Update']

export type Acheteur = Database['public']['Tables']['acheteurs']['Row']
export type AcheteurInsert = Database['public']['Tables']['acheteurs']['Insert']
export type AcheteurUpdate = Database['public']['Tables']['acheteurs']['Update']

export type CriteresRecherche = Database['public']['Tables']['criteres_recherche']['Row']
export type CriteresRechercheInsert = Database['public']['Tables']['criteres_recherche']['Insert']
export type CriteresRechercheUpdate = Database['public']['Tables']['criteres_recherche']['Update']

export type Matching = Database['public']['Tables']['matchings']['Row']
export type MatchingInsert = Database['public']['Tables']['matchings']['Insert']
export type MatchingUpdate = Database['public']['Tables']['matchings']['Update']

// Types pour le scoring
export type ScoreGrade = 'A' | 'B' | 'C' | 'D' | 'E'

export interface ScoreDetails {
  capacite_financiere: { score: number; max: number; commentaire: string }
  experience: { score: number; max: number; commentaire: string }
  serieux: { score: number; max: number; commentaire: string }
  motivation: { score: number; max: number; commentaire: string }
}

// Types pour les options de formulaire
export type Disponibilite = 'temps_plein' | 'partiel' | 'apres_vente'
export type DelaiReprise = 'immediat' | '6_mois' | '12_mois' | '24_mois'
export type TypeReprise = '100%' | 'majoritaire' | 'minoritaire'
export type Accompagnement = 'avocat' | 'expert_comptable' | 'cabinet_ma' | 'autre' | 'aucun'
