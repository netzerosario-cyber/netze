// ============================================================
// lib/adminSettings.ts
// CRUD de settings del admin via Supabase.
// Fallback a archivo local si Supabase no está disponible.
// ============================================================

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

// Service role para escritura
const supabaseAdmin = url && serviceKey ? createClient(url, serviceKey) : null;

// Anon para lectura pública
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const supabasePublic = url && anonKey ? createClient(url, anonKey) : null;

// ── Fallback local (dev sin Supabase) ────────────────────────
import fs from 'fs';
import path from 'path';

const LOCAL_FILE = path.join(process.cwd(), '.admin-settings.json');

function readLocal(): Record<string, unknown> {
  try {
    if (fs.existsSync(LOCAL_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf-8'));
    }
  } catch { /* ignore */ }
  return {};
}

function writeLocal(data: Record<string, unknown>) {
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(data, null, 2));
}

// ── Defaults ─────────────────────────────────────────────────
const DEFAULTS: Record<string, unknown> = {
  featured_ids: [],
  banner: { title: '', subtitle: '', image_url: '', cta_text: '', cta_link: '' },
  active_zones: [],
};

// ── GET setting ──────────────────────────────────────────────
export async function getSetting(key: string): Promise<unknown> {
  // Intentar Supabase primero
  if (supabasePublic) {
    try {
      const { data, error } = await supabasePublic
        .from('admin_settings')
        .select('value')
        .eq('key', key)
        .single();
      if (!error && data) return data.value;
    } catch { /* fallback a local */ }
  }

  // Fallback: archivo local
  const local = readLocal();
  return local[key] ?? DEFAULTS[key] ?? null;
}

// ── PUT setting ──────────────────────────────────────────────
export async function setSetting(key: string, value: unknown): Promise<boolean> {
  // Intentar Supabase primero
  if (supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin
        .from('admin_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (!error) return true;
      console.error('[AdminSettings] Supabase write error:', error.message);
    } catch (e) {
      console.error('[AdminSettings] Supabase unavailable, using local:', e);
    }
  }

  // Fallback: archivo local
  const local = readLocal();
  local[key] = value;
  writeLocal(local);
  return true;
}
