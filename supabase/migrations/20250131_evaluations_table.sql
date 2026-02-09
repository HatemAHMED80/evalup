-- Migration: Table evaluations pour nouveau modele tarifaire
-- Date: 2025-01-31
-- Description: Suivi des evaluations (flash vs complete) et achats unitaires

-- ============================================
-- TABLE EVALUATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  siren TEXT NOT NULL,
  entreprise_nom TEXT,

  -- Type d'evaluation
  type TEXT NOT NULL CHECK (type IN ('flash', 'complete')),

  -- Statut du parcours
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'flash_completed', 'payment_pending', 'paid', 'complete_in_progress', 'completed')),

  -- Progression
  questions_count INTEGER DEFAULT 0,
  documents_count INTEGER DEFAULT 0,

  -- Resultat valorisation
  valuation_low INTEGER, -- en euros
  valuation_high INTEGER, -- en euros
  valuation_method TEXT, -- methode principale utilisee

  -- Paiement (pour achat unique)
  stripe_payment_id TEXT, -- pi_xxx pour one-time
  amount_paid INTEGER, -- en centimes

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  flash_completed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- ============================================
-- TABLE PURCHASES (achats unitaires)
-- ============================================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  evaluation_id UUID REFERENCES evaluations(id) ON DELETE SET NULL,

  -- Details Stripe
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT,

  -- Produit achete
  product_type TEXT NOT NULL CHECK (product_type IN ('eval_complete')),
  amount INTEGER NOT NULL, -- en centimes
  currency TEXT DEFAULT 'eur',

  -- Statut
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- ============================================
-- TABLE EVAL_USAGE (compteur mensuel pour Pro 10)
-- ============================================
CREATE TABLE IF NOT EXISTS eval_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month DATE NOT NULL, -- Premier jour du mois (2025-01-01)
  evals_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- ============================================
-- INDEX POUR PERFORMANCES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_evaluations_user_id ON evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_siren ON evaluations(siren);
CREATE INDEX IF NOT EXISTS idx_evaluations_status ON evaluations(status);
CREATE INDEX IF NOT EXISTS idx_evaluations_type ON evaluations(type);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_eval_usage_user_month ON eval_usage(user_id, month);

-- ============================================
-- RLS (Row Level Security)
-- ============================================
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE eval_usage ENABLE ROW LEVEL SECURITY;

-- Policies pour evaluations
CREATE POLICY "Users can view own evaluations"
  ON evaluations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own evaluations"
  ON evaluations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own evaluations"
  ON evaluations FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies pour purchases
CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Policies pour eval_usage
CREATE POLICY "Users can view own eval_usage"
  ON eval_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Service role bypass (pour webhooks et API)
CREATE POLICY "Service role can manage all evaluations"
  ON evaluations FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage all purchases"
  ON purchases FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage all eval_usage"
  ON eval_usage FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour obtenir le nombre d'evals utilisees ce mois
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour incrementer le compteur d'evals
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour verifier si l'utilisateur peut faire une eval complete
CREATE OR REPLACE FUNCTION can_start_complete_eval(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan_id TEXT;
  v_evals_used INTEGER;
  v_evals_limit INTEGER;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
