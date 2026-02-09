-- Migration: Fonctions d'incrément atomique pour les compteurs d'évaluation
-- Date: 2025-02-10
-- Description: Corrige le problème de race condition sur les compteurs

-- Incrément atomique du compteur de questions
CREATE OR REPLACE FUNCTION increment_question_count(p_evaluation_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE evaluations
  SET questions_count = questions_count + 1
  WHERE id = p_evaluation_id
  RETURNING questions_count INTO v_count;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Incrément atomique du compteur de documents
CREATE OR REPLACE FUNCTION increment_document_count(p_evaluation_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE evaluations
  SET documents_count = documents_count + 1
  WHERE id = p_evaluation_id
  RETURNING documents_count INTO v_count;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ajouter SET search_path aux fonctions existantes (sécurité)
CREATE OR REPLACE FUNCTION get_monthly_eval_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COALESCE(evals_used, 0) INTO v_count
  FROM eval_usage
  WHERE user_id = p_user_id
    AND month = date_trunc('month', CURRENT_DATE)::DATE;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION increment_eval_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_month DATE := date_trunc('month', CURRENT_DATE)::DATE;
  v_count INTEGER;
BEGIN
  INSERT INTO eval_usage (user_id, month, evals_used)
  VALUES (p_user_id, v_month, 1)
  ON CONFLICT (user_id, month)
  DO UPDATE SET evals_used = eval_usage.evals_used + 1
  RETURNING evals_used INTO v_count;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Index composé pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_evaluations_user_siren_status
  ON evaluations(user_id, siren, status);
