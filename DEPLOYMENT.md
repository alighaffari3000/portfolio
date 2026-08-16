# Production Deployment Guide — Portfolio & Case Studies

This guide details the deployment of the Portfolio & Case Studies application on an Ubuntu VPS using Node.js LTS, PM2, Nginx, SQLite, and Certbot.

---

## 1. Directory Structure on VPS

Create persistent directories outside the git repository to keep database and user upload files persistent across code redeployments:

```bash
sudo mkdir -p /var/lib/portfolio/uploads
sudo chown -R $USER:$USER /var/lib/portfolio
```

Final physical structure:
- Database: `/var/lib/portfolio/data.db`
- Uploads: `/var/lib/portfolio/uploads/projects/<project-id>/`

---

## 2. Environment Configuration

> [!WARNING]
> **CRITICAL SECURITY REQUIREMENT**: Do NOT use default passwords (`admin123`) in production!
> On the production VPS, generate a unique, cryptographically strong password hash using Node:
> ```bash
> node -e "import('bcrypt').then(b => console.log(b.default.hashSync('YOUR_STRONG_PASSWORD', 10)))"
> ```
> Replace `ADMIN_PASSWORD_HASH` and `SESSION_SECRET` in `.env` with the generated values before launching.

Create `.env` file on the production server at the project root:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$...  # Generated strong bcrypt hash
SESSION_SECRET=<random-64-character-hex-string>
DATABASE_URL="file:/var/lib/portfolio/data.db"
UPLOADS_DIR="/var/lib/portfolio/uploads"
ALLOWED_HOSTS=example.com,www.example.com
NODE_ENV=production
HOST=127.0.0.1
PORT=4321
```

> **`ALLOWED_HOSTS` is mandatory — set it to your real domain(s) before building.**
>
> It feeds `security.allowedDomains` in `astro.config.mjs`. When that list is empty,
> Astro's `validateHost()` rejects the incoming `Host` header and falls back to
> `hostname = "localhost"`, so `Astro.url.origin` becomes `http://localhost` for every
> request. The built-in CSRF check then compares the browser's real `Origin` against
> `http://localhost`, never matches, and **every form POST — including all admin image
> uploads — fails with `403 Cross-site POST form submissions are forbidden`.**
>
> Comma-separated, hostnames only (no protocol, no path). Omitting the port matches any
> port. This value is read at **build time**, so re-run `npm run build` after changing it.
>
> Because Nginx terminates TLS and proxies to the Node process, also make sure the proxy
> passes the original host through — `proxy_set_header Host $host;` — otherwise the
> upstream sees the wrong host and the same 403 returns.


---

## 3. Database Migration & Build

On your build server or target VPS:

```bash
# Install production dependencies
npm ci

# Run Prisma production migrations (NEVER migrate dev in production)
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Build Astro Node SSR standalone bundle
npm run build
```

---

## 4. PM2 Process Manager & Reboot Survival

Start the Node SSR server with PM2 and configure automatic boot recovery:

```bash
# Start standalone Astro server process
pm2 start dist/server/entry.mjs --name portfolio

# Persist process list for system reboot
pm2 save

# Setup PM2 systemd startup hook (Run the command printed by pm2 startup)
pm2 startup
```

Verify status:
```bash
pm2 status
```

---

## 5. Nginx Reverse Proxy & Direct Static Serving

Create Nginx configuration file `/etc/nginx/sites-available/portfolio`:

```nginx
server {
    server_name yourdomain.com www.yourdomain.com;

    # Nginx directly serves upload images from /var/lib/portfolio/uploads
    location /uploads/ {
        alias /var/lib/portfolio/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
        try_files $uri =404;
    }

    # Reverse proxy all other requests to Astro Node SSR server
    location / {
        proxy_pass http://127.0.0.1:4321;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site & restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. HTTPS via Certbot

Obtain SSL certificate with Let's Encrypt:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
