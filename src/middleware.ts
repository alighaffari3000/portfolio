import { defineMiddleware } from 'astro:middleware';
import { verifySessionToken, SESSION_COOKIE_NAME } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  /*
    Keep the admin surface out of search results.

    `/admin` redirects an unauthenticated visitor to `/admin/login`, which is
    public and answers 200, so nothing stopped Google indexing the login page
    of this site's admin panel.

    A `noindex` directive rather than a robots.txt `Disallow`, which is the
    tool people reach for and the wrong one: robots.txt asks a crawler not to
    FETCH a URL, it does not ask it not to LIST one. A blocked page that
    anything links to can still appear in results, as a bare URL with no
    description, and because the crawler is not allowed to fetch it, it can
    never see a noindex telling it otherwise. Serving the directive on a page
    that stays crawlable is what actually keeps it out.

    Sent as a header rather than a <meta> tag so it also covers the redirect
    from `/admin` and the JSON from `/api/admin`, neither of which has a
    document to put a tag in. Layout.astro adds the meta tag as well for the
    HTML pages, in case a reverse proxy in front of this ever drops the header.
  */
  const isPrivate = pathname.startsWith('/admin') || pathname.startsWith('/api');

  const hideFromSearch = (response: Response) => {
    if (!isPrivate) return response;
    try {
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
      return response;
    } catch {
      // Some Response objects expose immutable headers; rebuild rather than throw.
      const headers = new Headers(response.headers);
      headers.set('X-Robots-Tag', 'noindex, nofollow');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }
  };

  // Public routes & login endpoints don't need session verification
  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return hideFromSearch(await next());
  }

  const sessionCookie = context.cookies.get(SESSION_COOKIE_NAME);
  const isAuthenticated = sessionCookie ? verifySessionToken(sessionCookie.value) : false;

  // Check admin API routes
  if (pathname.startsWith('/api/admin')) {
    if (!isAuthenticated) {
      return hideFromSearch(
        new Response(
          JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      );
    }
  }

  // Check admin UI routes
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      return hideFromSearch(context.redirect('/admin/login', 302));
    }
  }

  return hideFromSearch(await next());
});
