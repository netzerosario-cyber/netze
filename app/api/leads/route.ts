// ============================================================
// app/api/leads/route.ts — Server-side lead insertion
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { insertLead } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nombre, email, mensaje } = body;
    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }
    const { error } = await insertLead({ nombre, email, mensaje });
    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
