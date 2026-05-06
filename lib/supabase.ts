// ============================================================
// lib/supabase.ts
// Cliente Supabase + función insertLead
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
