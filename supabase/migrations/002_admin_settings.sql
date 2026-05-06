-- ============================================================
-- 002_admin_settings.sql
-- Tabla para configuraciones del panel admin (destacados, banner, zonas)
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Valores iniciales
INSERT INTO admin_settings (key, value) VALUES
  ('featured_ids', '[]'::jsonb),
  ('banner', '{"title":"","subtitle":"","image_url":"","cta_text":"","cta_link":""}'::jsonb),
  ('active_zones', '[]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Permitir acceso desde service role
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Policy: solo lectura pública (para que el portal lea destacados, banner, zonas)
CREATE POLICY "Public read" ON admin_settings FOR SELECT USING (true);

-- Policy: escritura solo desde service role (API routes del admin)
CREATE POLICY "Service write" ON admin_settings FOR ALL USING (true) WITH CHECK (true);
