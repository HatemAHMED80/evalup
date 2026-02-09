-- Migration: Sécurisation tables marketplace
-- Date: 2025-01-30
-- Description: Activer RLS et créer les policies pour acheteurs, vendeurs, criteres_recherche, matchings

-- ============================================
-- 1. ACTIVER RLS SUR TOUTES LES TABLES
-- ============================================
ALTER TABLE public.acheteurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendeurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criteres_recherche ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. RÉVOQUER L'ACCÈS PUBLIC
-- ============================================
REVOKE ALL ON public.acheteurs FROM PUBLIC;
REVOKE ALL ON public.acheteurs FROM anon;
REVOKE ALL ON public.vendeurs FROM PUBLIC;
REVOKE ALL ON public.vendeurs FROM anon;
REVOKE ALL ON public.criteres_recherche FROM PUBLIC;
REVOKE ALL ON public.criteres_recherche FROM anon;
REVOKE ALL ON public.matchings FROM PUBLIC;
REVOKE ALL ON public.matchings FROM anon;

-- ============================================
-- 3. POLICIES - ACHETEURS
-- ============================================

CREATE POLICY "acheteurs_select_own"
  ON public.acheteurs FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "acheteurs_insert_own"
  ON public.acheteurs FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "acheteurs_update_own"
  ON public.acheteurs FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "acheteurs_delete_own"
  ON public.acheteurs FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "acheteurs_service_role"
  ON public.acheteurs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================
-- 4. POLICIES - VENDEURS
-- ============================================

CREATE POLICY "vendeurs_select_own"
  ON public.vendeurs FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "vendeurs_insert_own"
  ON public.vendeurs FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "vendeurs_update_own"
  ON public.vendeurs FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "vendeurs_delete_own"
  ON public.vendeurs FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "vendeurs_service_role"
  ON public.vendeurs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================
-- 5. POLICIES - CRITERES_RECHERCHE
-- ============================================
-- Note: criteres_recherche n'a pas de user_id direct
-- On passe par acheteur_id -> acheteurs.user_id

CREATE POLICY "criteres_select_own"
  ON public.criteres_recherche FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) = (SELECT user_id FROM public.acheteurs WHERE id = acheteur_id)
  );

CREATE POLICY "criteres_insert_own"
  ON public.criteres_recherche FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = (SELECT user_id FROM public.acheteurs WHERE id = acheteur_id)
  );

CREATE POLICY "criteres_update_own"
  ON public.criteres_recherche FOR UPDATE TO authenticated
  USING (
    (SELECT auth.uid()) = (SELECT user_id FROM public.acheteurs WHERE id = acheteur_id)
  )
  WITH CHECK (
    (SELECT auth.uid()) = (SELECT user_id FROM public.acheteurs WHERE id = acheteur_id)
  );

CREATE POLICY "criteres_delete_own"
  ON public.criteres_recherche FOR DELETE TO authenticated
  USING (
    (SELECT auth.uid()) = (SELECT user_id FROM public.acheteurs WHERE id = acheteur_id)
  );

CREATE POLICY "criteres_service_role"
  ON public.criteres_recherche FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================
-- 6. POLICIES - MATCHINGS
-- ============================================
-- Note: matchings relie acheteurs et vendeurs
-- Un utilisateur peut voir les matchings où il est acheteur OU vendeur

CREATE POLICY "matchings_select_own"
  ON public.matchings FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) IN (
      SELECT user_id FROM public.acheteurs WHERE id = acheteur_id
      UNION
      SELECT user_id FROM public.vendeurs WHERE id = vendeur_id
    )
  );

CREATE POLICY "matchings_insert_system"
  ON public.matchings FOR INSERT TO authenticated
  WITH CHECK (
    -- Seul le propriétaire de l'acheteur peut créer un matching
    (SELECT auth.uid()) = (SELECT user_id FROM public.acheteurs WHERE id = acheteur_id)
  );

CREATE POLICY "matchings_update_parties"
  ON public.matchings FOR UPDATE TO authenticated
  USING (
    (SELECT auth.uid()) IN (
      SELECT user_id FROM public.acheteurs WHERE id = acheteur_id
      UNION
      SELECT user_id FROM public.vendeurs WHERE id = vendeur_id
    )
  );

CREATE POLICY "matchings_delete_acheteur"
  ON public.matchings FOR DELETE TO authenticated
  USING (
    (SELECT auth.uid()) = (SELECT user_id FROM public.acheteurs WHERE id = acheteur_id)
  );

CREATE POLICY "matchings_service_role"
  ON public.matchings FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================
-- 7. INDEX POUR PERFORMANCES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_acheteurs_user_id ON public.acheteurs(user_id);
CREATE INDEX IF NOT EXISTS idx_vendeurs_user_id ON public.vendeurs(user_id);
CREATE INDEX IF NOT EXISTS idx_criteres_acheteur_id ON public.criteres_recherche(acheteur_id);
CREATE INDEX IF NOT EXISTS idx_matchings_acheteur ON public.matchings(acheteur_id);
CREATE INDEX IF NOT EXISTS idx_matchings_vendeur ON public.matchings(vendeur_id);

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acheteurs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendeurs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.criteres_recherche TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matchings TO authenticated;
