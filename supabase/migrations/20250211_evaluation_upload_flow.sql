-- Migration: Ajout flow upload/review après paiement Stripe
-- Date: 2025-02-11
-- Description: Ajoute archetype_id, diagnostic_data et nouveaux statuts (pending_upload, pending_review)

-- ============================================
-- NOUVELLES COLONNES
-- ============================================

ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS archetype_id TEXT;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS diagnostic_data JSONB;

-- ============================================
-- MISE À JOUR CONTRAINTE STATUS
-- ============================================

ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_status_check;
ALTER TABLE evaluations ADD CONSTRAINT evaluations_status_check
  CHECK (status IN (
    'in_progress',
    'flash_completed',
    'payment_pending',
    'paid',
    'pending_upload',
    'pending_review',
    'complete_in_progress',
    'completed'
  ));

-- ============================================
-- INDEX
-- ============================================

CREATE INDEX IF NOT EXISTS idx_evaluations_archetype ON evaluations(archetype_id);
