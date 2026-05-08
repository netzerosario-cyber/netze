import { NextRequest, NextResponse } from 'next/server';

// ── Multi-user admin authentication ────────────────────────────
// Supports ADMIN_USERS env var (JSON array) with fallback to single ADMIN_USER/ADMIN_PASS
// Format: [{"email":"admin","pass":"netze2024"},{"email":"user@example.com","pass":"secret"}]
// ────────────────────────────────────────────────────────────────

interface AdminUser {
  email: string;
  pass: string;
}

function getAdminUsers(): AdminUser[] {
  // Try multi-user format first
  const usersRaw = process.env.ADMIN_USERS;
  if (usersRaw) {
    try {
      const parsed = JSON.parse(usersRaw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      console.error('[Netze Admin] Failed to parse ADMIN_USERS env var');
    }
  }
  // Fallback to single user
  const user = process.env.ADMIN_USER ?? 'admin';
  const pass = process.env.ADMIN_PASS ?? 'netze2024';
  return [{ email: user, pass }];
}

const COOKIE_NAME = 'netze_admin';
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 horas

export async function POST(req: NextRequest) {
  const { user, pass } = await req.json();

  const admins = getAdminUsers();
  const match = admins.find(
    (a) => (a.email === user || a.email === user) && a.pass === pass
  );

  if (!match) {
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
