import { readFile } from 'node:fs/promises';
import { db } from '../src/db.js';
import { storage } from '../src/modules/media.js';

const imageId = '0ba43fbd-5697-464a-a16f-1758489ac4cf';
const storageKey = 'images/' + imageId + '.webp';
const image = '/api/public/media/' + imageId;
const examples = {
  'en-US': {
    name: 'Sepawe Sanat', hero: 'Industrial solutions.\nBuilt with precision.',
    summary: 'Explore our capabilities in steel fabrication, industrial equipment, and engineering.',
    about: 'About our company', aboutBody: 'This sample page is ready for your company profile, engineering capabilities, and team.',
    products: ['Steel structures', 'Industrial equipment', 'Precision components'], projects: 'Fabrication facility',
    contact: 'Contact our team', quote: 'Request a quotation', privacy: 'Privacy policy',
    privacyBody: 'Contact details are collected when you submit an inquiry. Optional analytics collect page paths, device category, and an anonymous browser identifier. You can change your choice at any time.',
  },
  'fa-IR': {
    name: 'سپاوِه صنعت', hero: 'راهکارهای صنعتی،\nساخته‌شده با دقت',
    summary: 'با توانمندی‌های ما در ساخت سازه‌های فولادی، تجهیزات صنعتی و خدمات مهندسی آشنا شوید.',
    about: 'درباره شرکت', aboutBody: 'این صفحه نمونه برای معرفی شرکت، توانمندی‌های مهندسی و تیم شما آماده شده است.',
    products: ['سازه‌های فولادی', 'تجهیزات صنعتی', 'قطعات دقیق'], projects: 'کارگاه ساخت صنعتی',
    contact: 'ارتباط با ما', quote: 'درخواست پیش‌فاکتور', privacy: 'سیاست حریم خصوصی',
    privacyBody: 'اطلاعات تماس هنگام ارسال درخواست دریافت می‌شود. تحلیل اختیاری شامل مسیر صفحه، نوع دستگاه و شناسه ناشناس مرورگر است. می‌توانید انتخاب خود را تغییر دهید.',
  },
};
async function add(locale, type, slug, draft) {
  await db.content.upsert({
    where: { type_locale_slug: { type, locale, slug } },
    create: { locale, type, slug, draft, published: draft, publishedAt: new Date() },
    update: {},
  });
}
try {
  await storage.initialize();
  const bytes = await readFile(new URL('./assets/factory.webp', import.meta.url));
  await storage.put(storageKey, bytes).catch((error) => { if (error.code !== 'EEXIST') throw error; });
  await db.media.upsert({ where: { id: imageId }, update: {}, create: { id: imageId, storageKey, name: 'Sample fabrication facility', mime: 'image/webp', size: bytes.length, isPublic: true } });
  for (const [locale, copy] of Object.entries(examples)) {
    await add(locale, 'SETTINGS', 'site', { title: copy.name });
    await add(locale, 'PAGE', 'home', { title: copy.hero, summary: copy.summary, image });
    await add(locale, 'PAGE', 'about', { title: copy.about, body: copy.aboutBody });
    await add(locale, 'PAGE', 'contact', { title: copy.contact });
    await add(locale, 'PAGE', 'quote', { title: copy.quote });
    await add(locale, 'PAGE', 'privacy', { title: copy.privacy, body: copy.privacyBody });
    await add(locale, 'PRODUCT_CATEGORY', 'fabrication', { title: copy.products[0] });
    for (const [index, name] of ['structures', 'equipment', 'components'].entries()) {
      await add(locale, 'PRODUCT', name, { title: copy.products[index], image, category: 'fabrication' });
    }
    await add(locale, 'PROJECT', 'fabrication-facility', { title: copy.projects, image });
  }
} finally {
  await db.$disconnect();
}
