// ============================================================
// app/api/track/route.ts — Registra eventos de propiedad
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const VALID_EVENTS = ['view', 'whatsapp_click', 'map_click'];

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { property_id, event_type, property_title, property_address } = body;

    if (!property_id || !event_type) {
      return NextResponse.json({ error: 'property_id y event_type requeridos' }, { status: 400 });
    }
    if (!VALID_EVENTS.includes(event_type)) {
      return NextResponse.json({ error: `event_type inválido. Válidos: ${VALID_EVENTS.join(', ')}` }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      // Sin Supabase, simplemente logueamos
      console.info(`[Track] ${event_type} | prop=${property_id}`);
      return NextResponse.json({ ok: true, stored: false });
    }

    const { error } = await supabase.from('property_events').insert({
      property_id: String(property_id),
      event_type,
      property_title: property_title || null,
      property_address: property_address || null,
    });

    if (error) {
      console.error('[Track] Supabase insert error:', error.message);
      return NextResponse.json({ ok: true, stored: false });
    }

    return NextResponse.json({ ok: true, stored: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
