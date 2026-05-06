import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PATHS = ['/admin'];
const LOGIN_PATH = '/admin/login';
const COOKIE_NAME = 'netze_admin';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Solo aplica a rutas /admin (excepto /admin/login)
  const isAdminRoute = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isAdminRoute || pathname.startsWith(LOGIN_PATH)) return NextResponse.next();

  const session = req.cookies.get(COOKIE_NAME);
  if (!session || session.value !== 'authenticated') {
    const loginUrl = new URL(LOGIN_PATH, req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
