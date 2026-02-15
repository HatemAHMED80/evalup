-- Migration: Cache des données Pappers par SIREN
-- Date: 2025-02-13
-- Description: Évite la dépendance en temps réel à l'API Pappers.
--   Premier lookup → appel Pappers + stockage. Lookups suivants → cache.
--   Si Pappers KO → cache stale servi. TTL 30 jours.

-- ============================================
-- TABLE PAPPERS_CACHE
-- ============================================
CREATE TABLE IF NOT EXISTS pappers_cache (
  siren TEXT PRIMARY KEY,

  -- Données Pappers normalisées (sortie de rechercherEntreprise)
  raw_data JSONB NOT NULL,

  -- Réponse API complète pré-calculée (entreprise + initialContext)
  api_response JSONB NOT NULL,

  -- Metadata
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  hit_count INTEGER NOT NULL DEFAULT 0
);

-- Index pour le nettoyage périodique par TTL
CREATE INDEX IF NOT EXISTS idx_pappers_cache_expires ON pappers_cache(expires_at);

-- ============================================
-- RLS : lecture publique, écriture service role uniquement
-- ============================================
ALTER TABLE pappers_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pappers cache"
  ON pappers_cache FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage pappers cache"
  ON pappers_cache FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
