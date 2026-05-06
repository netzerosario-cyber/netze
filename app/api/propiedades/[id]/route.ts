// ============================================================
// app/api/propiedades/[id]/route.ts
// Proxy server-side para detalle de propiedad
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { getMockProperty } from '@/lib/mockData';

const TOKKO_BASE = 'https://www.tokkobroker.com/api/v1';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const key = process.env.TOKKO_API_KEY ?? '';

  // ── Sin API key → mock ────────────────────────────────────
  if (!key) {
    const property = getMockProperty(params.id);
    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ ...property, _source: 'mock' });
  }

  // ── Con API key → Tokko ───────────────────────────────────
  const url = `${TOKKO_BASE}/property/${params.id}/?key=${key}&format=json&lang=es_ar`;
  try {
    const res = await fetch(url, { next: { revalidate: 120 } });
    if (!res.ok) {
      return NextResponse.json({ error: 'Tokko error', status: res.status }, { status: 502 });
    }
    const json = await res.json();
    return NextResponse.json({ ...json, _source: 'tokko' });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
