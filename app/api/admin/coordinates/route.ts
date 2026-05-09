import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST: Crear tablas de cache de coordenadas
// GET: Listar propiedades con coordenadas imprecisas
export async function POST() {
  try {
    // Create cache table
    const { error: e1 } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS property_coordinates_cache (
          tokko_id TEXT PRIMARY KEY,
          original_lat NUMERIC, original_lng NUMERIC,
          corrected_lat NUMERIC, corrected_lng NUMERIC,
          correction_source TEXT NOT NULL DEFAULT 'tokko_original',
          is_imprecise BOOLEAN NOT NULL DEFAULT FALSE,
          address_query TEXT,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `,
    }).catch(() => ({ error: null }));

    // Try direct table creation via insert (will auto-create if configured)
    // If the table doesn't exist, we create it via a simpler approach:
    const { error: createErr } = await supabaseAdmin
      .from('property_coordinates_cache')
      .select('tokko_id')
      .limit(1);

    if (createErr && createErr.code === '42P01') {
      // Table doesn't exist — need to run SQL manually
      return NextResponse.json({
        ok: false,
        message: 'Las tablas no existen aún. Ejecutá el SQL en Supabase Dashboard → SQL Editor.',
        sql_file: '/supabase/migrations/001_coordinate_cache.sql',
        error: createErr.message,
      }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: 'Tablas de coordenadas verificadas correctamente.',
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  try {
    // List imprecise properties
    const { data, error } = await supabaseAdmin
      .from('property_coordinates_cache')
      .select('*')
      .eq('is_imprecise', true)
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also get recent corrections
    const { data: logs } = await supabaseAdmin
      .from('coordinate_correction_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    return NextResponse.json({
      imprecise_count: data?.length ?? 0,
      imprecise: data ?? [],
      recent_corrections: logs ?? [],
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch coordinate data' }, { status: 500 });
  }
}
