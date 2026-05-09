import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// PATCH /api/admin/coordinates/override
// Body: { tokko_id: string, lat: number, lng: number }
// Guarda override manual que NUNCA será sobreescrito por geocoding automático
export async function PATCH(req: NextRequest) {
  try {
    const { tokko_id, lat, lng } = await req.json();

    if (!tokko_id || typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        { error: 'Se requiere tokko_id (string), lat (number), lng (number)' },
        { status: 400 }
      );
    }

    // Validate coords are reasonable
    if (lat < -34 || lat > -31 || lng < -62 || lng > -59) {
      return NextResponse.json(
        { error: 'Coordenadas fuera del rango razonable para la zona de Rosario' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('property_coordinates_cache')
      .upsert({
        tokko_id,
        corrected_lat: lat,
        corrected_lng: lng,
        correction_source: 'manual_override',
        is_imprecise: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'tokko_id' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the manual correction
    await supabaseAdmin.from('coordinate_correction_log').insert({
      tokko_id,
      corrected_lat: lat,
      corrected_lng: lng,
      reason: 'Manual override by admin',
      source: 'manual_override',
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      message: `Coordenadas de propiedad ${tokko_id} actualizadas manualmente a [${lat}, ${lng}]. Este override NO será sobreescrito por el geocoding automático.`,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
