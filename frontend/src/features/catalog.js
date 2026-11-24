export const collections = {
  products: ['PRODUCT', 'Products', 'محصولات'],
  categories: ['PRODUCT_CATEGORY', 'Product categories', 'دسته‌بندی محصولات'],
  projects: ['PROJECT', 'Projects', 'پروژه‌ها'],
  news: ['ARTICLE', 'News & articles', 'اخبار و مقالات'],
  certificates: ['CERTIFICATE', 'Certificates', 'گواهینامه‌ها'],
};
export const pages = {
  about: ['About us', 'درباره ما'],
  contact: ['Contact', 'تماس با ما'],
  quote: ['Request a quotation', 'درخواست پیش‌فاکتور'],
  privacy: ['Privacy', 'حریم خصوصی'],
};
export function contentUrl(locale, type, slug) {
  return '/public/content/' + [locale, type, slug].filter(Boolean).join('/');
}
export function publicPath(locale, path = '') {
  return (locale === 'en-US' ? '/en' : '') + '/' + path;
}
