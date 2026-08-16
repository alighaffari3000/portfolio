import { defineMiddleware } from 'astro:middleware';
import { verifySessionToken, SESSION_COOKIE_NAME } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Public routes & login endpoints don't need session verification
  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return next();
  }

  const sessionCookie = context.cookies.get(SESSION_COOKIE_NAME);
  const isAuthenticated = sessionCookie ? verifySessionToken(sessionCookie.value) : false;

  // Check admin API routes
  if (pathname.startsWith('/api/admin')) {
    if (!isAuthenticated) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }

  // Check admin UI routes
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      return context.redirect('/admin/login', 302);
    }
  }

  return next();
});
