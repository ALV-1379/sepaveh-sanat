import { readFile } from 'node:fs/promises';
import { db } from '../src/db.js';
import { storage } from '../src/modules/media.js';
import { hashPassword } from '../src/modules/auth.js';

const imageId = '0ba43fbd-5697-464a-a16f-1758489ac4cf';
const storageKey = 'images/' + imageId + '.webp';
const image = '/api/public/media/' + imageId;
const seedVersion = 2;
const legacySeedTitles = new Set([
  'Industrial solutions.\nBuilt with precision.',
  'راهکارهای صنعتی،\nساخته‌شده با دقت',
  'About our company',
  'درباره شرکت',
  'Contact our team',
  'ارتباط با ما',
]);
const examples = {
  'en-US': {
    name: 'Sepaveh Sanat Naghsh Jahan', hero: 'Industrial drying and heating,\nengineered for stone production.',
    summary: 'Design and manufacture of indirect stone dryers, radiant heating systems, and industrial ventilation equipment.',
    about: 'About Sepaveh Sanat Naghsh Jahan',
    aboutBody: 'Sepaveh Sanat Naghsh Jahan began operating in 2013, designing and manufacturing heating systems and dryers for industry, with a specialist focus on indirect dryers for building stone. The company develops energy-efficient equipment that helps stone processors increase production speed and product quality. Its services include consultation before purchase, installation and commissioning, warranty support, periodic inspection, and after-sales service.',
    products: [
      { slug: 'indirect-stone-dryer', title: 'Indirect stone dryer', summary: 'High-efficiency drying equipment for slabs, blocks, and stone production lines.' },
      { slug: 'radiant-furnace', title: 'Radiant heating furnace', summary: 'Gas or electric radiant heating with controlled, even heat distribution.' },
      { slug: 'industrial-ventilation-fans', title: 'Industrial ventilation fans', summary: 'Supply and exhaust fans for industrial and general ventilation applications.' },
    ],
    projectNames: ['Jahan Sang stoneworks dryer', 'Yaghout stoneworks dryer', 'Valiasr stoneworks dryer'],
    contact: 'Contact our team', quote: 'Request a quotation', privacy: 'Privacy policy',
    contactBody: 'Address: Mahmoudabad Industrial Estate, Isfahan, Iran\nConsultation and orders: +98 919 241 4110\nEmail: info@sepavehsanat.com',
    privacyBody: 'Contact details are collected when you submit an inquiry. Optional analytics collect page paths, device category, and an anonymous browser identifier. You can change your choice at any time.',
  },
  'fa-IR': {
    name: 'سپاوه صنعت نقش جهان', hero: 'خشک‌کن و گرمایش صنعتی،\nمهندسی‌شده برای صنعت سنگ',
    summary: 'طراحی و ساخت خشک‌کن‌های غیرمستقیم سنگ، سیستم‌های گرمایشی تابشی و تجهیزات تهویه صنعتی.',
    about: 'درباره سپاوه صنعت نقش جهان',
    aboutBody: 'شرکت سپاوه صنعت نقش جهان از سال ۱۳۹۲ فعالیت خود را در زمینه طراحی و ساخت سیستم‌های گرمایشی و انواع خشک‌کن برای صنایع مختلف آغاز کرد و به‌صورت تخصصی بر خشک‌کن‌های غیرمستقیم صنعت سنگ ساختمانی تمرکز دارد. هدف شرکت، بهینه‌سازی مصرف انرژی و افزایش سرعت و کیفیت تولید در صنعت سنگ است. خدمات مجموعه شامل کارشناسی پیش از فروش، نصب و راه‌اندازی، ضمانت محصولات، بازرسی دوره‌ای و خدمات پس از فروش است.',
    products: [
      { slug: 'indirect-stone-dryer', title: 'خشک‌کن غیرمستقیم سنگ', summary: 'تجهیزات کم‌مصرف و پربازده برای خشک‌کردن اسلب، کوپ و خطوط تولید سنگ.' },
      { slug: 'radiant-furnace', title: 'کوره گرمایشی تابشی', summary: 'گرمایش تابشی گازی یا برقی با توزیع یکنواخت و کنترل‌شده حرارت.' },
      { slug: 'industrial-ventilation-fans', title: 'فن‌های تهویه صنعتی', summary: 'فن‌های مکنده و دمنده برای کاربردهای صنعتی و عمومی.' },
    ],
    projectNames: ['خشک‌کن سنگبری جهان سنگ', 'خشک‌کن سنگبری یاقوت', 'خشک‌کن سنگبری ولیعصر'],
    contact: 'ارتباط با ما', quote: 'درخواست پیش‌فاکتور', privacy: 'سیاست حریم خصوصی',
    contactBody: 'آدرس: اصفهان، شهرک صنعتی محمودآباد، شرکت سپاوه صنعت نقش جهان\nتلفن مشاوره و سفارش: ۰۹۱۹ ۲۴۱ ۴۱۱۰\nایمیل: info@sepavehsanat.com',
    privacyBody: 'اطلاعات تماس هنگام ارسال درخواست دریافت می‌شود. تحلیل اختیاری شامل مسیر صفحه، نوع دستگاه و شناسه ناشناس مرورگر است. می‌توانید انتخاب خود را تغییر دهید.',
  },
};
async function add(locale, type, slug, draft) {
  const where = { type_locale_slug: { type, locale, slug } };
  const current = await db.content.findUnique({ where });
  const seededDraft = { ...draft, seedVersion };
  if (!current) {
    await db.content.create({ data: { locale, type, slug, draft: seededDraft, published: seededDraft, publishedAt: new Date() } });
    return;
  }
  if (current.draft?.seedVersion || legacySeedTitles.has(current.draft?.title)) {
    await db.content.update({ where, data: { draft: seededDraft, published: seededDraft, publishedAt: new Date() } });
  }
}
try {
  await storage.initialize();
  const bytes = await readFile(new URL('./assets/factory.webp', import.meta.url));
  await storage.put(storageKey, bytes).catch((error) => { if (error.code !== 'EEXIST') throw error; });
  await db.media.upsert({ where: { id: imageId }, update: {}, create: { id: imageId, storageKey, name: 'Sample fabrication facility', mime: 'image/webp', size: bytes.length, isPublic: true } });
  await db.content.deleteMany({
    where: {
      slug: { in: ['fabrication', 'structures', 'equipment', 'components', 'fabrication-facility'] },
      OR: [
        { draft: { path: ['title'], equals: 'Steel structures' } },
        { draft: { path: ['title'], equals: 'سازه‌های فولادی' } },
        { draft: { path: ['title'], equals: 'Industrial equipment' } },
        { draft: { path: ['title'], equals: 'تجهیزات صنعتی' } },
        { draft: { path: ['title'], equals: 'Precision components' } },
        { draft: { path: ['title'], equals: 'قطعات دقیق' } },
        { draft: { path: ['title'], equals: 'Fabrication facility' } },
        { draft: { path: ['title'], equals: 'کارگاه ساخت صنعتی' } },
      ],
    },
  });
  for (const [locale, copy] of Object.entries(examples)) {
    await add(locale, 'SETTINGS', 'site', { title: copy.name });
    await add(locale, 'PAGE', 'home', {
      title: copy.hero,
      summary: copy.summary,
      image,
      seoTitle: locale === 'fa-IR' ? 'خشک‌کن سنگ و تجهیزات گرمایشی | سپاوه صنعت نقش جهان' : 'Stone drying and industrial heating | Sepaveh Sanat Naghsh Jahan',
      seoDescription: copy.summary,
    });
    await add(locale, 'PAGE', 'about', { title: copy.about, body: copy.aboutBody });
    await add(locale, 'PAGE', 'contact', { title: copy.contact, body: copy.contactBody });
    await add(locale, 'PAGE', 'quote', { title: copy.quote });
    await add(locale, 'PAGE', 'privacy', { title: copy.privacy, body: copy.privacyBody });
    await add(locale, 'PRODUCT_CATEGORY', 'industrial-heating', { title: locale === 'fa-IR' ? 'گرمایش و خشک‌کن صنعتی' : 'Industrial heating and drying' });
    await add(locale, 'MENU', 'main', { title: 'Main navigation', links: [
      { label: locale === 'fa-IR' ? 'خانه' : 'Home', target: '' },
      { label: locale === 'fa-IR' ? 'درباره ما' : 'About us', target: 'about' },
      { label: locale === 'fa-IR' ? 'محصولات' : 'Products', target: 'products' },
      { label: locale === 'fa-IR' ? 'پروژه‌ها' : 'Projects', target: 'projects' },
      { label: locale === 'fa-IR' ? 'تماس با ما' : 'Contact', target: 'contact' },
    ] });
    for (const product of copy.products) {
      await add(locale, 'PRODUCT', product.slug, { title: product.title, summary: product.summary, image, category: 'industrial-heating' });
    }
    for (const [index, title] of copy.projectNames.entries()) {
      await add(locale, 'PROJECT', ['jahan-sang', 'yaghout', 'valiasr'][index], { title, image, location: locale === 'fa-IR' ? 'ایران' : 'Iran' });
    }
  }
  if (process.env.NODE_ENV === 'development') {
    const email = process.env.DEMO_ADMIN_EMAIL;
    const password = process.env.DEMO_ADMIN_PASSWORD;
    if (email && password) {
      const passwordHash = await hashPassword(password);
      await db.user.upsert({
        where: { email },
        create: { email, passwordHash, role: 'SUPER_ADMIN' },
        update: { passwordHash, role: 'SUPER_ADMIN', active: true },
      });
      console.log(`Development Super Admin ready: ${email}`);
    }
  }
} finally {
  await db.$disconnect();
}
