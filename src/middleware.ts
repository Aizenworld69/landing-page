import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const USER_PROTECTED = ['/portal/my-courses'];
const ADMIN_PROTECTED = ['/portal/admin'];
const ADMIN_PUBLIC = ['/portal/admin/dangnhap'];

let jwksClient: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKSClient(supabaseUrl: string) {
  if (!jwksClient) {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    console.log('MIDDLEWARE SUPABASE URL:', supabaseUrl);
    console.log('MIDDLEWARE ANON KEY:', anonKey ? anonKey.substring(0, 10) + '...' : 'UNDEFINED');
    jwksClient = createRemoteJWKSet(
      new URL(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`),
      {
        headers: anonKey ? { apikey: anonKey } : undefined,
      }
    );
  }
  return jwksClient;
}

async function verifyToken(token: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  // 1. JWKS (Supabase ES256)
  if (supabaseUrl) {
    try {
      const JWKS = getJWKSClient(supabaseUrl);
      const { payload } = await jwtVerify(token, JWKS);
      return payload;
    } catch (err) {
      console.warn('JWKS verification failed, falling back to JWT_SECRET:', err);
    }
  }

  // 2. Fallback to JWT_SECRET (HS256)
  const secretStr = process.env.JWT_SECRET;
  if (!secretStr) {
    throw new Error('Neither JWKS nor JWT_SECRET is configured');
  }
  const secret = new TextEncoder().encode(secretStr);
  const { payload } = await jwtVerify(token, secret);
  return payload;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Admin routes ──────────────────────────────
  if (ADMIN_PROTECTED.some((p) => pathname.startsWith(p))) {
    const adminToken = req.cookies.get('admin_token');

    // Portal Admin login
    if (ADMIN_PUBLIC.some((p) => pathname.startsWith(p))) {
      if (adminToken?.value) {
        try {
          const payload = await verifyToken(adminToken.value);
          const role = (payload.app_metadata as { role?: string })?.role || payload.role;
          if (role === 'admin') {
            return NextResponse.redirect(new URL('/portal/admin', req.url));
          }
        } catch (err) {
          console.error('Portal Admin login redirect loop check error:', err);
        }
      }
      return NextResponse.next();
    }

    if (!adminToken?.value) {
      const url = new URL('/portal/admin/dangnhap', req.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    try {
      const payload = await verifyToken(adminToken.value);
      const role = (payload.app_metadata as { role?: string })?.role || payload.role;
      if (role !== 'admin') {
        throw new Error(`Not admin. Role is ${role}`);
      }
    } catch (err) {
      console.error('Portal Admin token verification error:', err);
      const url = new URL('/portal/admin/dangnhap', req.url);
      url.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(url);
      response.cookies.delete('admin_token');
      return response;
    }

    return NextResponse.next();
  }

  // ── User routes ───────────────────────────────
  const isProtected = USER_PROTECTED.some((p) => pathname.startsWith(p));
  const accessToken = req.cookies.get('access_token');
  const supabaseCookie = req.cookies.getAll().find(
    (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'),
  );
  const hasAuth = !!(accessToken || supabaseCookie);

  // Redirect if already logged in and trying to access portal auth pages
  if ((pathname.startsWith('/portal/auth/login') || pathname.startsWith('/portal/auth/register')) && hasAuth) {
    return NextResponse.redirect(new URL('/portal/my-courses', req.url));
  }

  if (isProtected && !hasAuth) {
    const loginUrl = new URL('/portal/auth/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/portal/my-courses/:path*',
    '/portal/admin/:path*',
    '/portal/auth/login',
    '/portal/auth/register'
  ],
};
