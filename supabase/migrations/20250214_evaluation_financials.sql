-- Migration: Colonnes pour les données financières extraites des documents
-- Date: 2025-02-14
-- Description: Stocke les données extraites des documents comptables (Pappers ou upload)
--   directement dans la table evaluations, liées à l'utilisateur.
--   Format extracted_financials: { exercices: ExerciceData[], metadata: { ... } }

-- ============================================
-- ALTER TABLE evaluations
-- ============================================

-- Données structurées extraites des documents (comptes annuels, liasses fiscales)
-- Même format que /api/documents/extract : { exercices: [...], metadata: { ... } }
ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS extracted_financials JSONB;

-- Origine des documents : none, pappers (auto), upload (manuel), mixed (les deux)
ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS documents_source TEXT DEFAULT 'none';

-- Statut du fetch automatique Pappers
ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS pappers_doc_status TEXT DEFAULT 'not_started';

-- Contraintes CHECK (séparées pour compatibilité ALTER)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'evaluations_documents_source_check'
  ) THEN
    ALTER TABLE evaluations
      ADD CONSTRAINT evaluations_documents_source_check
      CHECK (documents_source IN ('none', 'pappers', 'upload', 'mixed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'evaluations_pappers_doc_status_check'
  ) THEN
    ALTER TABLE evaluations
      ADD CONSTRAINT evaluations_pappers_doc_status_check
      CHECK (pappers_doc_status IN ('not_started', 'fetching', 'extracting', 'complete', 'error', 'not_available'));
  END IF;
END
$$;
