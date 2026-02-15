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
      evaluations: {
        Row: {
          id: string
          user_id: string
          siren: string
          entreprise_nom: string | null
          archetype_id: string | null
          diagnostic_data: Json | null
          type: string
          status: string
          questions_count: number
          documents_count: number
          valuation_low: number | null
          valuation_high: number | null
          valuation_method: string | null
          stripe_payment_id: string | null
          amount_paid: number | null
          extracted_financials: Json | null
          documents_source: string | null
          pappers_doc_status: string | null
          created_at: string
          paid_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          siren: string
          entreprise_nom?: string | null
          archetype_id?: string | null
          diagnostic_data?: Json | null
          type?: string
          status?: string
          questions_count?: number
          documents_count?: number
          valuation_low?: number | null
          valuation_high?: number | null
          valuation_method?: string | null
          stripe_payment_id?: string | null
          amount_paid?: number | null
          extracted_financials?: Json | null
          documents_source?: string | null
          pappers_doc_status?: string | null
          created_at?: string
          paid_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          siren?: string
          entreprise_nom?: string | null
          archetype_id?: string | null
          diagnostic_data?: Json | null
          type?: string
          status?: string
          questions_count?: number
          documents_count?: number
          valuation_low?: number | null
          valuation_high?: number | null
          valuation_method?: string | null
          stripe_payment_id?: string | null
          amount_paid?: number | null
          extracted_financials?: Json | null
          documents_source?: string | null
          pappers_doc_status?: string | null
          created_at?: string
          paid_at?: string | null
          completed_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          company_name: string | null
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          company_name?: string | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          company_name?: string | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          status: string
          plan_id: string
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          status: string
          plan_id: string
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: string
          plan_id?: string
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
        }
      }
      usage: {
        Row: {
          id: string
          user_id: string
          date: string
          tokens_used: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          tokens_used?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          tokens_used?: number
          created_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          amount_paid: number | null
          invoice_url: string | null
          invoice_pdf: string | null
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          amount_paid?: number | null
          invoice_url?: string | null
          invoice_pdf?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount_paid?: number | null
          invoice_url?: string | null
          invoice_pdf?: string | null
          created_at?: string
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

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert']
export type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update']

export type Usage = Database['public']['Tables']['usage']['Row']
export type UsageInsert = Database['public']['Tables']['usage']['Insert']
export type UsageUpdate = Database['public']['Tables']['usage']['Update']

export type Invoice = Database['public']['Tables']['invoices']['Row']
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']

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
