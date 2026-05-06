import { NextRequest, NextResponse } from 'next/server';

const ADMIN_USER = process.env.ADMIN_USER ?? 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS ?? 'netze2024';
const COOKIE_NAME = 'netze_admin';
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 horas

export async function POST(req: NextRequest) {
  const { user, pass } = await req.json();

  if (user !== ADMIN_USER || pass !== ADMIN_PASS) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, 'authenticated', {
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
