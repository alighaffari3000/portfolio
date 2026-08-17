/**
 * Bilingual site support.
 *
 * English is the default locale and is served from `/`. Persian is served from
 * `/fa` and rendered RTL. All UI chrome lives in the `ui` dictionary below;
 * project content comes from the database, where every translatable column has a
 * `*Fa` counterpart (see prisma/schema.prisma).
 */

export const LOCALES = ['en', 'fa'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** `/fa/projects/x` -> 'fa'; everything else -> 'en'. */
export function getLocaleFromPath(pathname: string): Locale {
  return pathname === '/fa' || pathname.startsWith('/fa/') ? 'fa' : 'en';
}

/** Prefix a default-locale path for the given locale: '/projects' -> '/fa/projects'. */
export function localizePath(path: string, locale: Locale): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === '/' ? '/fa' : `/fa${clean}`;
}

/** Same page in the other language — used by the nav language switcher. */
export function alternatePath(pathname: string, target: Locale): string {
  const base = pathname === '/fa' ? '/' : pathname.startsWith('/fa/') ? pathname.slice(3) : pathname;
  return localizePath(base || '/', target);
}

export const dir = (locale: Locale) => (locale === 'fa' ? 'rtl' : 'ltr');

/* ------------------------------------------------------------------ content */

export const ui = {
  en: {
    htmlLang: 'en',
    siteTitle: 'Ali Ghaffari — AI & LLM Engineer',
    siteDescription:
      'AI engineer building production AI products: agents, multi-agent systems, RAG pipelines and LLM applications — from architecture to deployment.',
    nav: { home: 'Home', projects: 'Projects', contact: 'Contact', switchTo: 'فارسی' },
    hero: {
      greeting: "Hi, I'm Ali Ghaffari",
      titleLine1: 'AI & LLM',
      titleLine2: 'Engineer',
      taglineBefore: 'Designing and shipping production ',
      taglineHighlight: 'AI products',
      taglineAfter:
        ' — intelligent agents, multi-agent systems and LLM applications — from architecture through to deployment.',
      stat: '30+ projects delivered',
    },
    services: {
      heading: 'What I do?',
      groups: [
        {
          title: 'AI Agents & Multi-Agent Systems',
          items: [
            'AI agent design and orchestration',
            'Multi-agent (collaborative) systems',
            'Function calling and MCP integrations',
            'Business process automation and intelligent workflows',
          ],
        },
        {
          title: 'LLM Applications & Chatbots',
          items: [
            'Text and voice chatbots for web, Telegram and other messengers',
            'Solutions built on OpenAI, Google Gemini and open-source models',
            'AI-powered SaaS products',
            'Prompt engineering and evaluation',
          ],
        },
        {
          title: 'RAG, Search & Data Processing',
          items: [
            'RAG pipelines and knowledge bases',
            'Vector databases and embeddings',
            'Document processing, OCR, PDF and Word analysis',
            'Speech-to-text and audio processing',
          ],
        },
        {
          title: 'Backend & Architecture',
          items: [
            'API design and system architecture',
            'FastAPI, PostgreSQL, Docker, Nginx on Linux',
            'Admin dashboards and management panels',
            'Deployment, monitoring and maintenance',
          ],
        },
      ],
    },
    why: {
      eyebrow: 'Why work with me',
      heading: 'How I work',
      items: [
        'Hands-on experience shipping real, production AI products',
        'Command of system architecture, backend development and AI service integration',
        'Scalable solutions designed to be extended, not rewritten',
        'Clean code, proper documentation and sound software engineering',
        'Commitment to quality, timelines and continuous communication',
      ],
    },
    projects: {
      eyebrow: 'My work',
      heading: 'Projects',
      empty: 'No case study projects published yet. Check back soon!',
      viewAll: 'View all projects',
      statusDeployed: 'Deployed',
      statusInProgress: 'In development',
      backToProjects: '← Back to projects',
      caseStudy: 'Technical case study',
      liveDemo: 'Live demo →',
      repository: 'GitHub repository',
    },
    caseStudy: {
      overview: 'Overview',
      overviewHeading: 'Project description',
      problem: 'Problem',
      problemHeading: 'The challenge',
      solution: 'Solution',
      solutionHeading: 'The approach',
      features: 'Features',
      featuresHeading: 'Key capabilities',
      architecture: 'Architecture',
      architectureHeading: 'System architecture',
      techStack: 'Tech stack',
      challenges: 'Challenges',
      challengesHeading: 'Challenges and trade-offs',
      results: 'Results',
      resultsHeading: 'Outcome and impact',
      gallery: 'Gallery',
      galleryHeading: 'Screenshots',
    },
    contact: {
      eyebrow: "Let's talk",
      heading: 'Contact',
      intro: 'Have a project or a product idea in mind? Feel free to reach out.',
      phone: 'Phone',
      telegram: 'Telegram',
      github: 'GitHub',
      cta: 'If you are building an AI product, an agent, an enterprise chatbot, an analysis platform or an intelligent automation, I can take it from design through to final deployment.',
    },
    footer: {
      builtWith: 'Built with',
      styledWith: 'Styled with',
      rights: 'All rights reserved.',
      likes: 'Likes',
      like: 'Like this site',
      liked: 'You already liked this site',
    },
    /* Strings that exist only for assistive technology — never rendered as
       visible copy, but they still have to be translated. */
    a11y: { skipToContent: 'Skip to content' },
    notFound: {
      title: 'Page not found',
      body: 'The project case study or page you are looking for does not exist or has been unpublished.',
      back: '← Return to projects',
    },
  },

  fa: {
    htmlLang: 'fa',
    siteTitle: 'علی غفاری — توسعه‌دهنده و متخصص هوش مصنوعی',
    siteDescription:
      'طراحی و پیاده‌سازی محصولات مبتنی بر هوش مصنوعی: ایجنت، سیستم‌های چندعامله، سامانه‌های RAG و اپلیکیشن‌های مبتنی بر مدل‌های زبانی بزرگ — از معماری تا استقرار.',
    nav: { home: 'خانه', projects: 'پروژه‌ها', contact: 'تماس', switchTo: 'English' },
    hero: {
      greeting: 'سلام، من علی غفاری هستم',
      titleLine1: 'متخصص',
      titleLine2: 'هوش مصنوعی',
      taglineBefore: 'طراحی و پیاده‌سازی ',
      taglineHighlight: 'محصولات هوش مصنوعی',
      taglineAfter:
        ' — ایجنت‌های هوشمند، سیستم‌های چندعامله و اپلیکیشن‌های مبتنی بر مدل‌های زبانی بزرگ — از معماری تا استقرار نهایی.',
      stat: 'بیش از ۳۰ پروژه اجراشده',
    },
    services: {
      heading: 'چه کاری انجام می‌دهم؟',
      groups: [
        {
          title: 'ایجنت هوش مصنوعی و سیستم‌های چندعامله',
          items: [
            'طراحی و توسعه AI Agent',
            'سیستم‌های چندعامله (Multi-Agent)',
            'یکپارچه‌سازی Function Calling و MCP',
            'اتوماسیون فرایندهای کسب‌وکار و طراحی Workflowهای هوشمند',
          ],
        },
        {
          title: 'محصولات مبتنی بر LLM و چت‌بات',
          items: [
            'چت‌بات‌های متن‌محور و صوت‌محور برای وب، تلگرام و سایر پیام‌رسان‌ها',
            'توسعه با OpenAI، Google Gemini و مدل‌های متن‌باز',
            'توسعه محصولات SaaS مبتنی بر هوش مصنوعی',
            'مهندسی پرامپت و ارزیابی خروجی مدل',
          ],
        },
        {
          title: 'RAG، جستجو و پردازش داده',
          items: [
            'طراحی و پیاده‌سازی RAG و Knowledge Base',
            'پایگاه‌داده برداری و Embedding',
            'پردازش اسناد، OCR و تحلیل فایل‌های PDF، Word و تصویر',
            'پردازش صوت و تبدیل گفتار به متن',
          ],
        },
        {
          title: 'بک‌اند و معماری نرم‌افزار',
          items: [
            'طراحی API و معماری سیستم',
            'FastAPI، PostgreSQL، Docker و Nginx روی لینوکس',
            'داشبوردهای مدیریتی و پنل‌های مدیریت',
            'استقرار، مانیتورینگ و نگهداری',
          ],
        },
      ],
    },
    why: {
      eyebrow: 'چرا من',
      heading: 'روش کار من',
      items: [
        'تجربه عملی در توسعه محصولات واقعی مبتنی بر هوش مصنوعی',
        'تسلط بر طراحی معماری، توسعه Backend و یکپارچه‌سازی سرویس‌های AI',
        'طراحی راهکارهای مقیاس‌پذیر و قابل توسعه',
        'کدنویسی تمیز، مستندسازی مناسب و رعایت اصول مهندسی نرم‌افزار',
        'تعهد به کیفیت، زمان‌بندی و ارتباط مستمر در طول اجرای پروژه',
      ],
    },
    projects: {
      eyebrow: 'نمونه‌کارها',
      heading: 'پروژه‌ها',
      empty: 'هنوز پروژه‌ای منتشر نشده است. به‌زودی سر بزنید!',
      viewAll: 'مشاهده همه پروژه‌ها',
      statusDeployed: 'مستقرشده',
      statusInProgress: 'در حال توسعه',
      backToProjects: '→ بازگشت به پروژه‌ها',
      caseStudy: 'مطالعه موردی فنی',
      liveDemo: 'مشاهده دمو →',
      repository: 'مخزن گیت‌هاب',
    },
    caseStudy: {
      overview: 'معرفی',
      overviewHeading: 'توضیح پروژه',
      problem: 'مسئله',
      problemHeading: 'چالش پروژه',
      solution: 'راهکار',
      solutionHeading: 'رویکرد پیاده‌سازی',
      features: 'قابلیت‌ها',
      featuresHeading: 'قابلیت‌های اصلی',
      architecture: 'معماری',
      architectureHeading: 'معماری سیستم',
      techStack: 'تکنولوژی‌ها',
      challenges: 'چالش‌ها',
      challengesHeading: 'چالش‌ها و راه‌حل‌ها',
      results: 'نتایج',
      resultsHeading: 'نتایج و دستاوردها',
      gallery: 'گالری',
      galleryHeading: 'تصاویر پروژه',
    },
    contact: {
      eyebrow: 'در تماس باشیم',
      heading: 'تماس',
      intro: 'پروژه یا ایده‌ای در ذهن دارید؟ راحت پیام بدهید.',
      phone: 'موبایل',
      telegram: 'تلگرام',
      github: 'گیت‌هاب',
      cta: 'اگر به دنبال توسعه یک محصول هوش مصنوعی، AI Agent، چت‌بات سازمانی، سامانه تحلیل اطلاعات یا اتوماسیون هوشمند هستید، پروژه را از مرحله طراحی تا استقرار نهایی به‌صورت کامل اجرا می‌کنم.',
    },
    footer: {
      builtWith: 'ساخته‌شده با',
      styledWith: 'استایل با',
      rights: 'تمامی حقوق محفوظ است.',
      likes: 'پسند',
      like: 'پسندیدن این سایت',
      liked: 'این سایت را پسندیده‌اید',
    },
    a11y: { skipToContent: 'رفتن به محتوای اصلی' },
    notFound: {
      title: 'صفحه پیدا نشد',
      body: 'صفحه یا مطالعه موردی موردنظر وجود ندارد یا از حالت انتشار خارج شده است.',
      back: '→ بازگشت به پروژه‌ها',
    },
  },
} as const;

export const t = (locale: Locale) => ui[locale];

/* ------------------------------------------------------------------ profile */

export const profile = {
  name: { en: 'Ali Ghaffari', fa: 'علی غفاری' },
  phone: '+989360115045',
  phoneDisplay: '+98 936 011 5045',
  telegramHandle: 'AliGhaffari3000',
  telegramUrl: 'https://t.me/AliGhaffari3000',
  githubUrl: 'https://github.com/alighaffari3000',
} as const;

/** Technologies shown in the marquee. Text only — no invented brand logos. */
export const techStack = [
  'Python', 'FastAPI', 'TypeScript', 'JavaScript', 'PostgreSQL', 'SQLite',
  'Docker', 'Linux', 'Nginx', 'OpenAI API', 'Google Gemini', 'LangChain',
  'MCP', 'RAG', 'Vector DB', 'Embeddings', 'Function Calling', 'n8n',
  'REST API', 'Telegram Bot API', 'Whisper', 'OCR', 'Git',
] as const;

/* ------------------------------------------------------------- project data */

type ProjectLike = Record<string, unknown>;

/**
 * Pick the fields for `locale`, falling back to the English value when the
 * Persian one is empty — a half-translated project still renders completely.
 */
export function resolveProject<T extends ProjectLike>(project: T, locale: Locale) {
  const pick = (base: string) => {
    const en = project[base];
    if (locale === DEFAULT_LOCALE) return (en ?? null) as string | null;
    const fa = project[`${base}Fa`];
    const faStr = typeof fa === 'string' ? fa.trim() : '';
    return (faStr ? faStr : (en ?? null)) as string | null;
  };

  const parseList = (raw: string | null): string[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
    } catch {
      return [];
    }
  };

  return {
    ...project,
    title: pick('title') ?? '',
    summary: pick('summary'),
    description: pick('description'),
    problem: pick('problem'),
    solution: pick('solution'),
    architecture: pick('architecture'),
    challenges: pick('challenges'),
    results: pick('results'),
    features: parseList(pick('features')),
    // techStack is a list of product names — the same in both languages.
    techStack: parseList((project.techStack ?? null) as string | null),
  };
}

/** Gallery captions follow the same fallback rule. */
export function resolveCaption(
  image: { caption?: string | null; captionFa?: string | null },
  locale: Locale
): string | null {
  if (locale === DEFAULT_LOCALE) return image.caption ?? null;
  return image.captionFa?.trim() ? image.captionFa : (image.caption ?? null);
}
