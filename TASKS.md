# TASKS — Portfolio + Project Case Studies

> منبع حقیقت معماری: [PLAN.md](PLAN.md) — پرامپت تحویل: [PROMPT.md](PROMPT.md)
> در صورت هرگونه تعارض بین این فایل و `PLAN.md`، **`PLAN.md` ارجح است**.

تسک‌ها به ترتیب اجرا شوند. هر تسک تا وقتی معیار پذیرش (DoD) کامل نشده، تمام‌شده تلقی نمی‌شود.

---

## فاز ۰ — پایه

### T1 · پیکربندی Astro SSR
**فایل‌ها:** `astro.config.mjs` · `package.json` · `.env.example`

- `output: "server"`
- `adapter: node({ mode: "standalone" })` از `@astrojs/node`
- integrationها: `react`, `tailwind`
- `.env.example` با کلیدهای: `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`,
  `DATABASE_URL`, `UPLOADS_DIR`

**DoD:** `npm run build` موفق است و خروجی یک Node server تولید می‌کند (نه static output).

---

### T2 · پورت و سفارشی‌سازی کامپوننت‌های پروژهٔ پایه
**فایل‌ها:** `src/Components/*` · `src/React/*` · `src/layouts/Layout.astro` · `src/pages/index.astro`

- انتقال از [`Gothsec/Astro-portfolio`](https://github.com/Gothsec/Astro-portfolio):
  `nav`, `home`, `projects`, `contact`, `footer`, `logoWall`
- کامپوننت‌های React: `LetterGlitch`, `SkillsList`, `LikeButton`
- بخش Projects در صفحهٔ اصلی به کارت‌های DB-driven تبدیل شود که به `/projects/[slug]` لینک می‌دهند
- زبان طراحی موجود حفظ شود

**DoD:** صفحهٔ اصلی رندر می‌شود و کارت‌های پروژه از دیتابیس می‌آیند، نه از آرایهٔ hardcode.

---

## فاز ۱ — داده و زیرساخت

### T3 · Prisma schema و migration
**فایل‌ها:** `prisma/schema.prisma` · `prisma/migrations/`

- provider: `sqlite`
- مدل‌های `Project` و `GalleryImage` **دقیقاً** طبق بخش ۵ فایل `PLAN.md`
- `onDelete: Cascade` روی رابطهٔ gallery
- `features` و `techStack` به‌صورت JSON string (بدون جدول جدا)
- اجرای `npx prisma migrate dev --name init`

**DoD:** migration تولید شده و `npx prisma studio` هر دو مدل را نشان می‌دهد.

---

### T4 · Prisma Client singleton
**فایل:** `src/lib/db.ts`

- یک instance مشترک که در dev با HMR دوباره ساخته نشود
- خواندن `DATABASE_URL` از env

**DoD:** در حالت dev با چند بار reload، هشدار «too many Prisma Client instances» ظاهر نمی‌شود.

---

## فاز ۲ — امنیت

### T5 · لایهٔ Authentication
**فایل:** `src/lib/auth.ts`

- `verifyCredentials()` با **bcrypt** در برابر `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH`
- `createSessionCookie()` / `verifySessionCookie()` با **HMAC-SHA256** و `SESSION_SECRET`
- payload شامل `{ authenticated, exp }` — طول عمر **۷ روز**
- کوکی: `httpOnly` · `sameSite=strict` · `secure` در production · `max-age` صریح
- مقایسهٔ امضا به‌صورت **constant-time**
- **بدون جدول User. بدون جدول Session.**

**DoD:** کوکی دستکاری‌شده و کوکی منقضی هر دو رد می‌شوند.

---

### T6 · Middleware guard
**فایل:** `src/middleware.ts`

| مسیر | حالت unauthenticated |
|---|---|
| `/admin/*` (به‌جز `/admin/login`) | `302` → `/admin/login` |
| `/api/admin/*` (به‌جز login) | `401` + بدنهٔ **JSON** |

- هرگز کلاینت API به HTML redirect نشود

**DoD:** `curl` روی یک API ادمین بدون کوکی، `401` با `content-type: application/json` برمی‌گرداند؛
مرورگر روی `/admin` به صفحهٔ لاگین می‌رود.

---

### T7 · لایهٔ Upload
**فایل:** `src/lib/upload.ts`

- استفاده از `await request.formData()` بومی — **busboy اضافه نشود**
- Validation: MIME (`jpeg`/`png`/`webp`)، پسوند (`jpg`/`jpeg`/`png`/`webp`)،
  **رد SVG و GIF**، حداکثر **5MB**، حداکثر **30** تصویر گالری در هر پروژه
- نام فایل **سمت سرور** تولید شود؛ به filename کلاینت اعتماد نشود
- جلوگیری از path traversal — مسیر نهایی همیشه زیر `UPLOADS_DIR` بماند
- مسیر فیزیکی بر اساس **project id** (نه slug):
  `UPLOADS_DIR/projects/<project-id>/`
- در DB فقط **URL عمومی** ذخیره شود: `/uploads/projects/<project-id>/...`
- helperها: `saveHero()` (فایل قبلی را حذف کند)، `saveGalleryImage()`, `deleteFile()`,
  `deleteProjectDir()`
- خطاهای فایل‌سیستم واضح log شوند

**DoD:** آپلود SVG رد می‌شود؛ فایل ۶ مگابایتی رد می‌شود؛ جایگزینی hero فایل قبلی را روی دیسک باقی نمی‌گذارد.

---

## فاز ۳ — API و UI

### T8 · API احراز هویت
**فایل‌ها:** `src/pages/api/admin/login.ts` · `logout.ts`

- `POST /api/admin/login` — تأیید با bcrypt، صدور کوکی امضاشده
- `POST /api/admin/logout` — پاک کردن کوکی

**DoD:** لاگین نامعتبر رد می‌شود؛ لاگین معتبر کوکی معتبر می‌دهد؛ logout دسترسی را قطع می‌کند.

---

### T9 · API عملیات CRUD پروژه
**فایل‌ها:** `src/pages/api/admin/projects/index.ts` · `[id].ts`

- `POST /api/admin/projects`
- `PUT` و `DELETE` روی `/api/admin/projects/:id`
- اعتبارسنجی فرمت `slug` و اعتبارسنجی `project id` پیش از هر عملیات DB
- `features` / `techStack` به‌صورت JSON string ذخیره شوند
- `DELETE` علاوه بر رکوردها، **دایرکتوری آپلود پروژه** را هم حذف کند

**DoD:** ایجاد/ویرایش/حذف کار می‌کند و حذف هیچ فایل orphan باقی نمی‌گذارد.

---

### T10 · API آپلود و گالری
**فایل‌ها:** `src/pages/api/admin/projects/[id]/upload.ts` ·
`src/pages/api/admin/projects/[id]/gallery/[imageId].ts`

- `POST .../upload` — هم برای `hero` و هم برای `gallery`
- `DELETE .../gallery/:imageId` — حذف فایل فیزیکی **و** رکورد DB
- اعمال سقف تعداد تصاویر گالری و پشتیبانی از reorder

**DoD:** موارد ۱۵ تا ۲۰ چک‌لیست verification در `PLAN.md` سبز می‌شوند.

---

### T11 · صفحات عمومی
**فایل‌ها:** `src/pages/projects/index.astro` · `src/pages/projects/[slug].astro`

- SSR با **صدا زدن مستقیم Prisma** — مسیر `page → API → Prisma` ممنوع است
- `/projects`: فقط پروژه‌های `published`، مرتب بر اساس `order` سپس `createdAt`
- `/projects/[slug]`: رندر **شرطی** همهٔ بخش‌ها — Overview, Problem, Solution, Features,
  Architecture, Tech Stack, Challenges, Results, Gallery, GitHub, Demo
- slug ناموجود یا unpublished → `404`
- حفظ امن line breakها — **بدون `set:html` روی محتوای ورودی**
- عنوان صفحه و meta description از دادهٔ پروژه ساخته شود

**DoD:** پروژه‌ای با فقط عنوان و توضیح، هیچ سکشن خالی‌ای نمایش نمی‌دهد.

---

### T12 · صفحات پنل ادمین
**فایل‌ها:** `src/pages/admin/login.astro` · `index.astro` ·
`projects/new.astro` · `projects/[id]/edit.astro`

- `/admin` — لیست پروژه‌ها + toggle انتشار + تنظیم `order` + حذف
- فرم ایجاد و ویرایش با **`textarea` معمولی** برای فیلدهای Case Study
- آپلود/جایگزینی hero، آپلود چندتایی گالری، حذف و reorder تصاویر
- **بدون Rich Text Editor. بدون MDX.**

**DoD:** یک پروژهٔ کامل از صفر تنها از طریق UI و بدون لمس دیتابیس یا کد ساخته می‌شود.

---

## فاز ۴ — استقرار و تأیید

### T13 · استقرار روی VPS
**فایل‌ها:** `DEPLOYMENT.md` · تنظیمات Nginx · تنظیمات PM2

- Ubuntu + Node LTS
- `npx prisma migrate deploy` — **هرگز `migrate dev` در production**
- `pm2 start dist/server/entry.mjs` + `pm2 startup` (بقا پس از ریبوت)
- Nginx reverse proxy به پروسهٔ Node
- Nginx مسیر `/uploads/` را **مستقیماً** از `/var/lib/portfolio/uploads` سرو کند
  (بدون proxy از داخل Astro)
- HTTPS با Certbot
- دیتابیس و uploads **خارج از ریپو**: `/var/lib/portfolio/`

**DoD:** سایت روی HTTPS بالا می‌آید و پس از `reboot` بدون دخالت دستی برمی‌گردد.

---

### T14 · اجرای چک‌لیست verification
**مرجع:** بخش ۱۵ فایل `PLAN.md`

اجرای هر ۲۴ مورد و گزارش نتیجه.

**DoD:** هر ۲۴ مورد سبز است. هر مورد ناموفق باید پیش از اعلام اتمام رفع شود.

---

## اصل راهنما

> **Keep the implementation minimal and maintainable. Do not over-engineer.**
