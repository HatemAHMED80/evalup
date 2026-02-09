-- Migration: Fix SECURITY DEFINER functions
-- Date: 2025-02-09
-- Description: Ajoute SET search_path = public aux fonctions SECURITY DEFINER
--              pour éviter les injections SQL via manipulation de schéma

-- Fix handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix get_monthly_eval_count
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

-- Fix increment_eval_count
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

-- Fix can_start_complete_eval
CREATE OR REPLACE FUNCTION can_start_complete_eval(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan_id TEXT;
  v_evals_used INTEGER;
  v_has_purchase BOOLEAN;
BEGIN
  -- Verifier si l'utilisateur a un achat unitaire non utilise
  SELECT EXISTS(
    SELECT 1 FROM purchases p
    JOIN evaluations e ON e.id = p.evaluation_id
    WHERE p.user_id = p_user_id
      AND p.status = 'succeeded'
      AND e.status IN ('paid', 'complete_in_progress')
  ) INTO v_has_purchase;

  IF v_has_purchase THEN
    RETURN TRUE;
  END IF;

  -- Verifier l'abonnement
  SELECT plan_id INTO v_plan_id
  FROM subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Pro unlimited = toujours OK
  IF v_plan_id = 'pro_unlimited' THEN
    RETURN TRUE;
  END IF;

  -- Pro 10 = verifier la limite
  IF v_plan_id = 'pro_10' THEN
    v_evals_used := get_monthly_eval_count(p_user_id);
    RETURN v_evals_used < 10;
  END IF;

  -- Legacy plans = OK
  IF v_plan_id IN ('pro_monthly', 'pro_yearly') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
