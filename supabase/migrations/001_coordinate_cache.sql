-- ============================================================
-- Supabase: Tablas para el sistema de coordenadas
-- Ejecutar en Supabase SQL Editor (Dashboard → SQL)
-- ============================================================

-- 1. Cache de coordenadas corregidas
CREATE TABLE IF NOT EXISTS property_coordinates_cache (
  tokko_id          TEXT PRIMARY KEY,
  original_lat      NUMERIC,
  original_lng      NUMERIC,
  corrected_lat     NUMERIC,
  corrected_lng     NUMERIC,
  correction_source TEXT NOT NULL DEFAULT 'tokko_original'
    CHECK (correction_source IN ('tokko_original', 'mapbox_geocoded', 'manual_override')),
  is_imprecise      BOOLEAN NOT NULL DEFAULT FALSE,
  address_query     TEXT,
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Index para búsqueda rápida por imprecisas
CREATE INDEX IF NOT EXISTS idx_coords_imprecise 
  ON property_coordinates_cache (is_imprecise) WHERE is_imprecise = TRUE;

-- 2. Log de correcciones (auditoría)
CREATE TABLE IF NOT EXISTS coordinate_correction_log (
  id             SERIAL PRIMARY KEY,
  tokko_id       TEXT NOT NULL,
  original_lat   NUMERIC,
  original_lng   NUMERIC,
  corrected_lat  NUMERIC,
  corrected_lng  NUMERIC,
  reason         TEXT,
  source         TEXT,
  address        TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Index para buscar por propiedad
CREATE INDEX IF NOT EXISTS idx_correction_log_tokko 
  ON coordinate_correction_log (tokko_id);

-- 3. Enable RLS (Row Level Security) for safety
ALTER TABLE property_coordinates_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordinate_correction_log ENABLE ROW LEVEL SECURITY;

-- Policy: allow service role full access (our backend uses service_role key)
CREATE POLICY "Service role full access on coords cache"
  ON property_coordinates_cache FOR ALL
  USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access on correction log"
  ON coordinate_correction_log FOR ALL
  USING (TRUE) WITH CHECK (TRUE);
