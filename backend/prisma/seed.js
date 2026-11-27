import { readFile } from 'node:fs/promises';
import { db } from '../src/db.js';
import { storage } from '../src/modules/media.js';
import { hashPassword } from '../src/modules/auth.js';

const imageId = '0ba43fbd-5697-464a-a16f-1758489ac4cf';
const storageKey = 'images/' + imageId + '.webp';
const image = '/api/public/media/' + imageId;
const seedVersion = 4;
// Equipment and project photographs sourced from sepaveh.com.
const equipmentPhotos = {
  'indirect-stone-dryer': 'khoshkon-gheirmostaghim-makhsus-sang',
  'radiant-furnace': 'system-garmayeshi-tabeshi',
  'industrial-ventilation-fans': 'fan-backward',
  'production-line-dryer': 'khoshkon-gheirmostaghim-khat-tulid',
  'jahan-sang': 'sangbori-jahansang-koore-gheiremostaghim-845x684',
  'yaghout': 'sangbori-iaghoot-kooreh-845x684',
  'valiasr': 'sangbori-valiasr-kooreh-khoshkkon-845x684',
};
const descriptions = {
  'indirect-stone-dryer': ['سنگ روی پالت در محفظه قرار می‌گیرد و هوای گرم در اطراف آن گردش می‌کند. انتقال غیرمستقیم گرما، سنگ را از تماس مستقیم با شعله دور نگه می‌دارد.', 'Stone sits on pallets inside a chamber where warm air circulates around the load. Indirect heating keeps the stone away from direct flame.'],
  'radiant-furnace': ['سامانه گرمایش تابشی، گرما را به سطح هدف منتقل می‌کند. نوع منبع گرما و چیدمان تجهیزات با توجه به فضای نصب و فرایند تولید انتخاب می‌شود.', 'Radiant heating transfers heat to the target surface. Heat source and equipment layout depend on the installation space and production process.'],
  'industrial-ventilation-fans': ['فن‌های مکنده و دمنده برای تخلیه یا تأمین هوا استفاده می‌شوند. دبی هوا و افت فشار مسیر کانال در انتخاب فن اهمیت دارند.', 'Supply and exhaust fans move air into or out of industrial spaces. Airflow and duct pressure losses are important when selecting a fan.'],
  'slab-dryer': ['این دستگاه برای خشک‌کردن اسلب پیش از مراحل رزین‌کاری و نصب توری به کار می‌رود. ابعاد اسلب و روش بارگیری در انتخاب محفظه اهمیت دارند.', 'This dryer prepares slabs for resin application and mesh backing. Slab dimensions and the loading method guide chamber selection.'],
  'block-dryer': ['خشک‌کن کوپ برای آماده‌سازی بلوک سنگ پیش از فرایندهایی مانند تزریق مواد به ترک‌ها طراحی می‌شود. ابعاد و وزن کوپ در طراحی محفظه و بارگیری لحاظ می‌شود.', 'A block dryer prepares stone blocks for processes such as resin injection into fissures. Block size and weight inform chamber and loading design.'],
  'production-line-dryer': ['خشک‌کن در مسیر فرآوری نصب می‌شود تا مرحله خشک‌کردن با سرعت خط هماهنگ شود. زمان ماند و دما بر اساس نوع سنگ و مراحل بعدی تعیین می‌شوند.', 'This dryer fits into the processing line so drying can keep pace with production. Residence time and temperature depend on the stone and downstream steps.'],
};

async function seedEquipmentPhotos() {
  const photos = {};
  for (const [index, [slug, filename]] of Object.entries(equipmentPhotos).entries()) {
    const id = `20000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
    const storageKey = `images/${id}.webp`;
    const bytes = await readFile(new URL(`./assets/${filename}.webp`, import.meta.url));
    await storage.put(storageKey, bytes).catch((error) => { if (error.code !== 'EEXIST') throw error; });
    await db.media.upsert({ where: { id }, update: {}, create: { id, storageKey, name: filename, mime: 'image/webp', size: bytes.length, isPublic: true } });
    photos[slug] = '/api/public/media/' + id;
  }
  return photos;
}
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
      { slug: 'slab-dryer', title: 'Slab stone dryer', summary: 'Uniform and controlled drying for resin, mesh, and finishing stages.' },
      { slug: 'block-dryer', title: 'Stone block dryer', summary: 'Heavy-duty indirect heating designed for large stone blocks and demanding shifts.' },
      { slug: 'production-line-dryer', title: 'Continuous production-line dryer', summary: 'A configurable drying tunnel for continuous, high-capacity stone processing.' },
    ],
    projectNames: ['Jahan Sang stoneworks dryer', 'Yaghout stoneworks dryer', 'Valiasr stoneworks dryer', 'Shahin Stone heating line', 'Negin Sang slab dryer', 'Parseh Stone ventilation system'],
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
      { slug: 'slab-dryer', title: 'خشک‌کن سنگ اسلب', summary: 'خشک‌کردن یکنواخت و کنترل‌شده برای مراحل رزین، توری و پرداخت سنگ.' },
      { slug: 'block-dryer', title: 'خشک‌کن سنگ کوپ', summary: 'گرمایش غیرمستقیم صنعتی برای کوپ‌های بزرگ و شیفت‌های کاری سنگین.' },
      { slug: 'production-line-dryer', title: 'خشک‌کن تونلی خط تولید', summary: 'تونل خشک‌کن قابل تنظیم برای خطوط پیوسته و ظرفیت بالای فرآوری سنگ.' },
    ],
    projectNames: ['خشک‌کن سنگبری جهان سنگ', 'خشک‌کن سنگبری یاقوت', 'خشک‌کن سنگبری ولیعصر', 'خط گرمایش شاهین سنگ', 'خشک‌کن اسلب نگین سنگ', 'سامانه تهویه پارسه سنگ'],
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
  const photos = await seedEquipmentPhotos();
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
      image: photos['indirect-stone-dryer'],
      seoTitle: locale === 'fa-IR' ? 'خشک‌کن سنگ و تجهیزات گرمایشی | سپاوه صنعت نقش جهان' : 'Stone drying and industrial heating | Sepaveh Sanat Naghsh Jahan',
      seoDescription: copy.summary,
      blocks: [
        { id: '10000000-0000-4000-8000-000000000001', type: 'statistics', enabled: true, title: locale === 'fa-IR' ? 'تجربه‌ای که به تولید شما سرعت می‌دهد' : 'Experience that accelerates production', items: locale === 'fa-IR' ? [{ title: '+۱۲ سال', body: 'تجربه تخصصی' }, { title: '+۱۲۰', body: 'پروژه صنعتی' }, { title: '۲۴/۷', body: 'پشتیبانی فنی' }] : [{ title: '12+ years', body: 'Specialist experience' }, { title: '120+', body: 'Industrial projects' }, { title: '24/7', body: 'Technical support' }] },
        { id: '10000000-0000-4000-8000-000000000002', type: 'features', enabled: true, title: locale === 'fa-IR' ? 'چرا سپاوه صنعت؟' : 'Why Sepaveh Sanat?', items: locale === 'fa-IR' ? [{ title: 'مصرف انرژی بهینه', body: 'طراحی مهندسی برای کاهش اتلاف حرارت' }, { title: 'ساخت سفارشی', body: 'متناسب با ابعاد و ظرفیت خط شما' }, { title: 'خدمات کامل', body: 'از مشاوره تا نصب و پشتیبانی' }] : [{ title: 'Energy efficient', body: 'Engineered to reduce heat loss' }, { title: 'Made to fit', body: 'Matched to your line and capacity' }, { title: 'End-to-end service', body: 'From consultation to ongoing support' }] },
        { id: '10000000-0000-4000-8000-000000000003', type: 'products', enabled: true, title: locale === 'fa-IR' ? 'محصولات منتخب' : 'Featured products' },
        { id: '10000000-0000-4000-8000-000000000004', type: 'projects', enabled: true, title: locale === 'fa-IR' ? 'پروژه‌های اجراشده' : 'Selected projects' },
        { id: '10000000-0000-4000-8000-000000000005', type: 'testimonials', enabled: true, title: locale === 'fa-IR' ? 'اعتماد صنعتگران' : 'Trusted by industry' },
        { id: '10000000-0000-4000-8000-000000000006', type: 'cta', enabled: true, title: locale === 'fa-IR' ? 'برای ارتقای خط تولید آماده‌اید؟' : 'Ready to upgrade your production line?', body: locale === 'fa-IR' ? 'کارشناسان ما برای بررسی نیاز و ارائه راهکار کنار شما هستند.' : 'Our specialists are ready to assess your needs and propose the right solution.' },
      ],
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
      await add(locale, 'PRODUCT', product.slug, { title: product.title, summary: product.summary, body: descriptions[product.slug][locale === 'fa-IR' ? 0 : 1], image: photos[product.slug] || image, category: 'industrial-heating' });
    }
    for (const [index, title] of copy.projectNames.entries()) {
      const slug = ['jahan-sang', 'yaghout', 'valiasr', 'shahin-stone', 'negin-stone', 'parseh-stone'][index];
      await add(locale, 'PROJECT', slug, {
        title, image: photos[slug] || image,
        summary: photos[slug]
          ? (locale === 'fa-IR' ? 'نمونه خشک‌کن سنگ معرفی‌شده در وب‌سایت سپاوه صنعت.' : 'Stone dryer installation featured on the Sepaveh Sanat website.')
          : (locale === 'fa-IR' ? 'نمونه آزمایشی برای نمایش ساختار صفحات پروژه.' : 'Example entry for the project portfolio.'),
      });
    }
    const articles = locale === 'fa-IR' ? [
      ['stone-drying-guide', 'راهنمای انتخاب خشک‌کن سنگ', 'ظرفیت، نوع سوخت و ابعاد خط تولید سه عامل اصلی انتخاب یک خشک‌کن صنعتی هستند.'],
      ['reduce-energy-consumption', '۵ راه کاهش مصرف انرژی در سنگبری', 'عایق‌کاری، کنترل هوشمند دما و سرویس دوره‌ای می‌تواند هزینه انرژی را به شکل محسوسی کاهش دهد.'],
      ['radiant-heating-benefits', 'مزایای گرمایش تابشی در صنعت', 'گرمایش تابشی، حرارت را یکنواخت و مستقیم به سطح هدف می‌رساند و اتلاف انرژی را محدود می‌کند.'],
    ] : [
      ['stone-drying-guide', 'How to choose a stone dryer', 'Capacity, fuel type, and production-line dimensions are the three key factors in selecting an industrial dryer.'],
      ['reduce-energy-consumption', 'Five ways to reduce stoneworks energy use', 'Insulation, smart temperature control, and preventive maintenance can significantly reduce energy costs.'],
      ['radiant-heating-benefits', 'Benefits of radiant heating in industry', 'Radiant systems deliver even heat directly to the target surface and limit wasted energy.'],
    ];
    for (const [slug, title, summary] of articles) await add(locale, 'ARTICLE', slug, { title, summary, body: summary, image });
    const testimonials = locale === 'fa-IR' ? [['jahan-sang-review', 'مدیریت جهان سنگ', 'کیفیت خشک‌کردن یکنواخت شد و زمان توقف خط کاهش پیدا کرد.'], ['yaghout-review', 'مدیریت سنگبری یاقوت', 'تیم فنی از طراحی تا راه‌اندازی دقیق و پاسخگو بود.'], ['valiasr-review', 'مدیریت سنگبری ولیعصر', 'مصرف انرژی پس از نصب سیستم جدید به شکل قابل‌توجهی بهبود یافت.']] : [['jahan-sang-review', 'Jahan Sang management', 'Drying became consistent and production-line downtime was reduced.'], ['yaghout-review', 'Yaghout Stoneworks management', 'The technical team was precise and responsive from design through commissioning.'], ['valiasr-review', 'Valiasr Stoneworks management', 'Energy performance improved significantly after installing the new system.']];
    for (const [slug, title, body] of testimonials) await add(locale, 'TESTIMONIAL', slug, { title, body });
    for (const [index, title] of (locale === 'fa-IR' ? ['گواهی کیفیت ساخت', 'گواهی ایمنی تجهیزات', 'گواهی رضایت مشتریان'] : ['Manufacturing quality certificate', 'Equipment safety certificate', 'Customer satisfaction certificate']).entries()) await add(locale, 'CERTIFICATE', `certificate-${index + 1}`, { title, image, summary: locale === 'fa-IR' ? 'مدرک نمونه جهت نمایش در نسخه آزمایشی وب‌سایت.' : 'Sample credential for the website demonstration.' });
    await add(locale, 'BANNER', 'home', { title: locale === 'fa-IR' ? 'مشاوره تخصصی رایگان' : 'Free specialist consultation', summary: locale === 'fa-IR' ? 'پیش از خرید، ظرفیت و نیاز خط تولید شما را بررسی می‌کنیم.' : 'We assess your line capacity and requirements before purchase.', image });
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
