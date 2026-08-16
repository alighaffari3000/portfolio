# PLAN — Portfolio + Project Case Studies

> معماری تأییدشده. پیاده‌سازی باید دقیقاً از این سند پیروی کند.
> لیست تسک‌ها: [TASKS.md](TASKS.md) — پرامپت تحویل به توسعه‌دهنده: [PROMPT.md](PROMPT.md)

---

## به‌روزرسانی — سایت دوزبانه شد

پس از نگارش این سند، دو تصمیم جدید گرفته شد و پیاده‌سازی شد:

- **سایت دوزبانه است.** انگلیسی پیش‌فرض و روی `/`؛ فارسی روی `/fa` با `dir="rtl"` و فونت
  محلی Vazirmatn. متن‌های ثابت رابط در `src/lib/i18n.ts` نگهداری می‌شوند.
- **محتوای هر پروژه دوزبانه است.** هر فیلد قابل ترجمه یک ستون `*Fa` هم دارد
  (`titleFa`، `problemFa` و…). اگر مقدار فارسی خالی باشد، نسخه انگلیسی در صفحه فارسی
  رندر می‌شود — منطق در `resolveProject()` داخل `src/lib/i18n.ts`.
- `slug`، `heroImage`، `githubUrl`، `demoUrl`، `published`، `order` و `techStack`
  بین دو زبان مشترک‌اند؛ بنابراین `/projects/x` و `/fa/projects/x` یک رکورد واحدند.

بنابراین بخش ۵ (Database) و بخش ۸ (Routes) این سند با `prisma/schema.prisma` و
`src/pages/` فعلی تکمیل شده‌اند.

### دو نکته حیاتی که در عمل کشف شد

1. **`security.allowedDomains` در `astro.config.mjs` اجباری است.** اگر خالی باشد، Astro
   هر درخواست را `http://localhost` می‌بیند و بررسی CSRF داخلی‌اش **همه POSTهای فرمی —
   از جمله تمام آپلودهای تصویر — را با ۴۰۳ رد می‌کند**. مقدار از `ALLOWED_HOSTS` خوانده
   می‌شود و در **زمان build** اعمال می‌گردد.
2. **ریست CSS باید داخل `@layer base` بماند.** در Tailwind v4، CSSِ بدون لایه بر
   utilityهای لایه‌دار غلبه می‌کند؛ یک `* { padding: 0; margin: 0 }` بدون لایه، تمام
   کلاس‌های padding و margin پروژه را از کار می‌اندازد.

اجرای چک‌لیست تأیید: `node scripts/verify.mjs` (روی **بیلد production**، نه dev server).

---

## ۱. Context

هدف نهایی صرفاً یک Portfolio با کارت پروژه نیست؛ خروجی باید **Portfolio + Project Case Studies**
باشد: هر پروژه یک صفحه کامل و قابل ارائه با Route مستقل (`/projects/[slug]`) دارد که همه بخش‌های
آن (مسئله، راهکار، معماری، گالری، چالش‌ها و…) **اختیاری** هستند و فقط در صورت پر بودن رندر می‌شوند.

داده پروژه‌ها کاملاً از UI جدا است و از طریق یک **Admin Panel** در Database مدیریت می‌شود، طوری که
افزودن پروژه جدید هیچ تغییری در کد کامپوننت‌ها لازم نداشته باشد و **بدون Rebuild** بلافاصله منتشر شود.

میزبانی روی یک **VPS اوبونتو** انجام می‌شود (نه هاست استاتیک)، بنابراین فایل‌سیستم پایدار و پروسه
Node دائمی در دسترس است.

پایه Frontend: ریپوی [`Gothsec/Astro-portfolio`](https://github.com/Gothsec/Astro-portfolio)
(Astro + React + TypeScript + TailwindCSS).

---

## ۲. Stack

```
Astro · React · TypeScript · Tailwind CSS
@astrojs/node (SSR / standalone)
Prisma · SQLite
bcrypt
PM2 · Nginx · Certbot
```

**نباید اضافه شود:** Redis، PostgreSQL، Docker، سرویس API جدا، CMS، MDX،
Rich Text Editor، جدول User، جدول Session، هر Abstraction غیرضروری.

---

## ۳. معماری کلی

```
                    Nginx
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
  Astro / Node (SSR)          /uploads/  (static)
        │                           │
  ┌─────┼─────┬──────────┐          ▼
  ▼     ▼     ▼          ▼    /var/lib/portfolio/uploads/
Website Projects Admin  API Routes
                          │   (admin write/delete/upload only)
                          ▼
                       Prisma
                          ▼
                       SQLite
                 /var/lib/portfolio/data.db
```

قواعد معماری:

- **یک اپلیکیشن Astro SSR**، بدون Backend جدا. صفحات public، صفحات پروژه، پنل ادمین و APIهای ادمین
  همگی در همان پروسه Node اجرا می‌شوند.
- `output: "server"` + `adapter: @astrojs/node` (standalone).
- **صفحات public مستقیم Prisma را صدا می‌زنند** (SSR). هیچ API عمومی برای خواندن پروژه‌ها ساخته نمی‌شود.
  مسیر `Browser → /projects/foo → /api/... → Prisma` صراحتاً ممنوع است؛ مسیر درست
  `Browser → /projects/foo → Prisma → HTML` است.
- API فقط برای عملیات **نوشتن / حذف / آپلود** ادمین لازم است.

---

## ۴. ساختار فایل‌ها

```
prisma/
├── schema.prisma
└── migrations/
src/
├── Components/            # از پروژه پایه، سفارشی‌سازی می‌شود
├── React/
├── layouts/
│   └── Layout.astro
├── lib/
│   ├── db.ts              # Prisma Client singleton
│   ├── auth.ts            # bcrypt + signed session cookie
│   └── upload.ts          # validation / save / delete
├── middleware.ts          # گارد /admin/* و /api/admin/*
└── pages/
    ├── index.astro
    ├── projects/
    │   ├── index.astro
    │   └── [slug].astro
    ├── admin/
    │   ├── login.astro
    │   ├── index.astro
    │   └── projects/
    │       ├── new.astro
    │       └── [id]/
    │           └── edit.astro
    └── api/
        └── admin/
            ├── login.ts
            ├── logout.ts
            └── projects/
                ├── index.ts
                ├── [id].ts
                └── [id]/
                    ├── upload.ts
                    └── gallery/
                        └── [imageId].ts

خارج از ریپو (persistent):
/var/lib/portfolio/
├── data.db
└── uploads/projects/<project-id>/
    ├── hero.webp
    └── gallery/<generated-name>.webp
```

---

## ۵. Database

Prisma + SQLite.

- **Production DB خارج از ریپو و خارج از `public/`:** `/var/lib/portfolio/data.db`
- Development: `npx prisma migrate dev`
- Production: `npx prisma migrate deploy` (هرگز `migrate dev` در production)

```prisma
model Project {
  id           String   @id @default(cuid())
  slug         String   @unique
  title        String
  summary      String?
  heroImage    String?
  description  String?
  problem      String?
  solution     String?
  features     String?   // JSON array as string
  techStack    String?   // JSON array as string
  architecture String?
  challenges   String?
  results      String?
  githubUrl    String?
  demoUrl      String?
  published    Boolean  @default(true)
  order        Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  gallery      GalleryImage[]
}

model GalleryImage {
  id        String  @id @default(cuid())
  projectId String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  url       String
  caption   String?
  order     Int     @default(0)
}
```

- `features` و `techStack` به صورت **JSON string** ذخیره می‌شوند؛ به جدول جدا Normalize نمی‌شوند.
  مثال: `["Authentication","RAG","Telegram Bot"]`
- **Visibility فقط `published: Boolean`** — بدون draft / archived / scheduled / featured.
- **Ordering فقط `order: Int`** — مرتب‌سازی با `order` و سپس یک کلید ثانویهٔ قطعی مثل `createdAt`.
  Drag & Drop پیچیده لازم نیست مگر پیاده‌سازی‌اش بدیهی باشد.

---

## ۶. Authentication

دقیقاً **یک حساب ادمین**. **بدون جدول User. بدون جدول Session.**

Environment variables:

```
ADMIN_USERNAME
ADMIN_PASSWORD_HASH     # bcrypt
SESSION_SECRET
DATABASE_URL
UPLOADS_DIR
```

- تأیید رمز با **bcrypt**.
- پس از لاگین موفق، یک **signed HMAC session cookie** صادر می‌شود.
- Payload شامل وضعیت authenticated و **timestamp انقضا**.
- Cookie: `httpOnly` · `secure` در production · `sameSite=strict` · `max-age/expires` صریح.
- طول عمر پیش‌فرض session: **۷ روز**.
- Logout کوکی را پاک می‌کند.
- مقایسه امضا باید constant-time باشد.

---

## ۷. Middleware

دو رفتار **متفاوت**، این تمایز حیاتی است:

| مسیر | حالت unauthenticated |
|---|---|
| `/admin/*` (به‌جز `/admin/login`) | `302` redirect به `/admin/login` |
| `/api/admin/*` (به‌جز login) | `401` با بدنهٔ **JSON** |

هرگز کلاینت API را به صفحهٔ HTML لاگین redirect نکنید.

---

## ۸. Routes

### Public

```
/
/projects
/projects/[slug]
```

### Admin (UI)

```
/admin/login
/admin
/admin/projects/new
/admin/projects/[id]/edit
```

### API (فقط ادمین)

```
POST   /api/admin/login
POST   /api/admin/logout
POST   /api/admin/projects
PUT    /api/admin/projects/:id
DELETE /api/admin/projects/:id
POST   /api/admin/projects/:id/upload
DELETE /api/admin/projects/:id/gallery/:imageId
```

---

## ۹. صفحهٔ Case Study

`/projects/[slug]` — Dynamic SSR route.

بخش‌های ممکن (**همه اختیاری، فقط در صورت غیرخالی بودن رندر می‌شوند**):

```
Overview · Problem · Solution · Features · Architecture
Tech Stack · Challenges · Results · Gallery · GitHub · Demo
```

قواعد رندر:

- **بدون MDX. بدون Rich Text Editor.** در پنل ادمین از `textarea` معمولی استفاده می‌شود.
- Line breakها به‌صورت امن حفظ می‌شوند.
- **هرگز HTML دلخواه کاربر رندر نمی‌شود** (بدون `set:html` روی محتوای ورودی).
- عنوان صفحه و meta description از داده‌های پروژه ساخته می‌شوند.
- slug ناموجود یا پروژهٔ unpublished → `404`.

---

## ۱۰. Admin Panel — قابلیت‌ها

```
list projects            create project           edit project
delete project           publish / unpublish      set display order
upload / replace hero    upload gallery images    delete gallery image
reorder gallery images
```

---

## ۱۱. File Storage

فایل‌های آپلودی **خارج از ریپو** ذخیره می‌شوند: `/var/lib/portfolio/uploads/`

**دایرکتوری فیزیکی بر اساس `project id` است، نه `slug`** — تا تغییر slug هیچ اثری روی فایل‌ها نگذارد:

```
/var/lib/portfolio/uploads/projects/<project-id>/
├── hero.webp
└── gallery/<generated-name>.webp
```

### Validation

| مورد | مقدار |
|---|---|
| MIME مجاز | `image/jpeg`, `image/png`, `image/webp` |
| پسوند مجاز | `jpg`, `jpeg`, `png`, `webp` |
| رد می‌شود | **SVG**, **GIF** |
| حداکثر حجم هر فایل | **5 MB** |
| حداکثر تصاویر گالری هر پروژه | **30** |

- از `await request.formData()` بومی استفاده کنید. **busboy اضافه نکنید** مگر اثبات شود FormData بومی کافی نیست.
- نام فایل **سمت سرور** تولید می‌شود؛ به filename کلاینت هرگز اعتماد نکنید.
- Path traversal باید مسدود شود (مسیر نهایی همیشه زیر `UPLOADS_DIR` بماند).

### مقادیر داخل Database

در DB **URL عمومی** ذخیره می‌شود، نه مسیر فایل‌سیستم:

```
/uploads/projects/<project-id>/hero.webp
```

مسیر فیزیکی یک نگرانی داخلی `lib/upload.ts` است و بیرون درز نمی‌کند.

### Static serving

تصاویر از داخل Astro proxy نمی‌شوند. **Nginx مسیر `/uploads/` را مستقیماً** از
`/var/lib/portfolio/uploads/` سرو می‌کند.

### File Lifecycle (بحرانی — فایل orphan نباید بماند)

- **جایگزینی hero:** ذخیرهٔ فایل جدید → به‌روزرسانی DB → حذف فایل hero قبلی → مدیریت امن خطا.
- **حذف تصویر گالری:** حذف فایل فیزیکی + حذف رکورد DB.
- **حذف پروژه:** حذف کل دایرکتوری آپلود پروژه + حذف رکوردهای DB (gallery با cascade).
- بین SQLite و فایل‌سیستم **تراکنش توزیع‌شده پیاده نکنید**؛ خطاهای فایل‌سیستم را واضح log کنید و
  عملیات را تا حد عملی failure-safe نگه دارید.

---

## ۱۲. Security Checklist

- احراز هویت در **هر** mutation ادمین بررسی شود.
- `project id` پیش از عملیات DB اعتبارسنجی شود.
- فرمت `slug` اعتبارسنجی شود.
- نوع و حجم همهٔ فایل‌های آپلودی اعتبارسنجی شود.
- Path traversal مسدود شود.
- به filename کلاینت اعتماد نشود.
- HTML دلخواه رندر نشود.
- Secrets خارج از Git بمانند.
- در production کوکی `secure` باشد.

---

## ۱۳. Environment (نمونه)

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$...
SESSION_SECRET=<random-32-bytes-hex>
DATABASE_URL=file:/var/lib/portfolio/data.db
UPLOADS_DIR=/var/lib/portfolio/uploads
```

---

## ۱۴. Deployment

Ubuntu VPS · Node LTS · PM2 · Nginx · HTTPS via Certbot

```
build Astro SSR app
prisma migrate deploy
pm2 start (Node SSR server)
pm2 startup                       # بقا پس از ریبوت
nginx reverse proxy               # به پروسهٔ Node
nginx static serving /uploads/    # از /var/lib/portfolio/uploads/
database + uploads outside repo   # پایدار بین deployها
```

---

## ۱۵. Verification (۲۴ مورد)

| # | مورد |
|---|---|
| 1 | `npm run build` موفق است |
| 2 | صفحهٔ اصلی کار می‌کند |
| 3 | `/projects` پروژه‌های published را لیست می‌کند |
| 4 | `/projects/[slug]` مستقیم از SQLite می‌خواند |
| 5 | فیلدهای خالی Case Study رندر نمی‌شوند |
| 6 | ایجاد پروژه در ادمین بدون Rebuild فوراً قابل مشاهده است |
| 7 | ویرایش پروژه فوراً خروجی public را به‌روز می‌کند |
| 8 | پروژه‌های unpublished به‌صورت عمومی مخفی هستند |
| 9 | `/admin` کاربر unauthenticated را به `/admin/login` redirect می‌کند |
| 10 | `/api/admin/*` در حالت unauthenticated `401` JSON برمی‌گرداند |
| 11 | لاگین نامعتبر رد می‌شود |
| 12 | لاگین معتبر یک session cookie امضاشده و دارای انقضا می‌سازد |
| 13 | sessionهای منقضی رد می‌شوند |
| 14 | Logout سشن را پاک می‌کند |
| 15 | فرمت‌های تصویر نامعتبر رد می‌شوند |
| 16 | فایل‌های بزرگ‌تر از حد مجاز رد می‌شوند |
| 17 | آپلود SVG و GIF رد می‌شود |
| 18 | محدودیت تعداد تصاویر گالری اعمال می‌شود |
| 19 | جایگزینی hero فایل فیزیکی قبلی را حذف می‌کند |
| 20 | حذف تصویر گالری فایل فیزیکی آن را حذف می‌کند |
| 21 | حذف پروژه دایرکتوری آپلود و رکوردهای DB را حذف می‌کند |
| 22 | تغییر slug پروژه فایل‌ها را جابه‌جا یا خراب نمی‌کند |
| 23 | URLهای عمومی تصاویر مستقیماً توسط Nginx سرو می‌شوند |
| 24 | استقرار PM2 + Nginx پس از ریبوت VPS کار می‌کند |

---

## ۱۶. اصل راهنما

> **Keep the implementation minimal and maintainable. Do not over-engineer.**
> کوچک‌ترین معماری قابل اتکا که این نیازمندی‌ها را برآورده کند.
