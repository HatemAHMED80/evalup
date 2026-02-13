-- Migration: Fix refund-related schema mismatches
-- Date: 2025-02-12
-- Description: Ajoute les colonnes et statuts manquants pour le flow de remboursement
--              Sans cette migration, le webhook charge.refunded echoue silencieusement

-- ============================================
-- 1. PURCHASES: Ajouter colonnes refund
-- ============================================
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS refund_amount INTEGER; -- en centimes

-- 2. PURCHASES: Mettre a jour CHECK constraint pour inclure partially_refunded
ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_status_check;
ALTER TABLE purchases ADD CONSTRAINT purchases_status_check
  CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'partially_refunded'));

-- ============================================
-- 3. EVALUATIONS: Ajouter 'refunded' au CHECK constraint
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
    'completed',
    'refunded'
  ));
