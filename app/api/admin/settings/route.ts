// ============================================================
// app/api/admin/settings/route.ts
// GET ?key=featured_ids  → devuelve el valor
// PUT { key, value }     → actualiza el valor
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSetting, setSetting } from '@/lib/adminSettings';

const COOKIE_NAME = 'netze_admin';

function isAuth(req: NextRequest): boolean {
  return req.cookies.get(COOKIE_NAME)?.value === 'authenticated';
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'key requerida' }, { status: 400 });
  const value = await getSetting(key);
  return NextResponse.json({ key, value });
}

export async function PUT(req: NextRequest) {
  if (!isAuth(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const body = await req.json();
  const { key, value } = body;
  if (!key) return NextResponse.json({ error: 'key requerida' }, { status: 400 });
  const ok = await setSetting(key, value);
  if (!ok) return NextResponse.json({ error: 'Error al guardar' }, { status: 500 });
  return NextResponse.json({ ok: true, key, value });
}
