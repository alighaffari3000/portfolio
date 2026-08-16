// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';

const { ALLOWED_HOSTS } = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');

/*
  Hosts this server is allowed to be reached on.

  This is NOT optional. Astro's `validateHost()` returns undefined whenever
  `security.allowedDomains` is empty, and `createRequest()` then falls back to
  `hostname = "localhost"` — so `Astro.url.origin` becomes `http://localhost`
  for every request, no matter what Host header arrived. The built-in CSRF check
  compares the browser's `Origin` header against that origin, so with an empty
  allowlist EVERY form POST (multipart uploads included) is rejected with
  "Cross-site POST form submissions are forbidden" in the production build.

  Omitting the port matches any port. Set ALLOWED_HOSTS to the real domain on the
  VPS, e.g. ALLOWED_HOSTS=example.com,www.example.com
*/
const allowedHosts = (ALLOWED_HOSTS ?? 'localhost,127.0.0.1')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  security: {
    allowedDomains: allowedHosts.map((hostname) => ({ hostname }))
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()]
  }
});
