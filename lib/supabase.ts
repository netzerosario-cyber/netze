// ============================================================
// lib/supabase.ts
// Cliente Supabase + función insertLead
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Lazy init: evita crash durante build si las env vars no están disponibles
let _supabase: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('[Supabase] NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY son requeridas');
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}
// Backward compat — lazy getter
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// ------------------------------------------------------------
// Tipos
// ------------------------------------------------------------

export interface LeadPayload {
  nombre: string;
  email: string;
  mensaje?: string;
  propiedad_id?: string;
  propiedad_titulo?: string;
}

export interface Lead extends LeadPayload {
  id: string;
  created_at: string;
}

// ------------------------------------------------------------
// insertLead — inserta un lead en la tabla leads
// ------------------------------------------------------------

export async function insertLead(payload: LeadPayload): Promise<{ data: Lead | null; error: string | null }> {
  const { data, error } = await supabase
    .from('leads')
    .insert([
      {
        nombre: payload.nombre,
        email: payload.email,
        mensaje: payload.mensaje ?? null,
        propiedad_id: payload.propiedad_id ?? null,
        propiedad_titulo: payload.propiedad_titulo ?? null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error insertando lead:', error.message);
    return { data: null, error: error.message };
  }

  return { data: data as Lead, error: null };
}
