import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowDown, ArrowUpLeft, ArrowUpRight, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { Link, NavLink, useLocation, useSearchParams } from 'react-router';
import { useApi } from '../app/api';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import { CatalogDownload, CatalogShowcase, EquipmentGallery } from '../components/common/CatalogShowcase';
import { Blocks, Cards, MediaImage } from '../features/Blocks';
import { collections, contentUrl, pages, publicPath } from '../features/catalog';
import { trackVisit } from '../features/visits';

const Inquiry = lazy(() => import('../features/Inquiry').then((module) => ({ default: module.Inquiry })));

function Status({ fa, error, home }) {
  return <div className={home && !error ? 'home-loading container section' : 'container section'} role={error ? 'alert' : 'status'}>{error ? (fa ? 'محتوا در دسترس نیست.' : 'Content is temporarily unavailable.') : (fa ? 'در حال بارگذاری…' : 'Loading…')}</div>;
}
function NotFound({ fa, home }) {
  return <section className="container section"><h1>404</h1><p>{fa ? 'صفحه پیدا نشد.' : 'This page could not be found.'}</p><Link className="button primary" to={home}>{fa ? 'صفحه اصلی' : 'Back to home'}</Link></section>;
}
function HeroSlider({ slides, fa }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    if (!playing || paused || slides.length < 2) return undefined;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, [playing, paused, slides.length]);
  useEffect(() => setActive(0), [slides.length]);
  const move = (step) => setActive((current) => (current + step + slides.length) % slides.length);
  return <section className="hero-slider" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} aria-roledescription="carousel" aria-label={fa ? 'اسلایدر معرفی' : 'Featured slider'}>
    {slides.map((slide, index) => <article className={'hero-slide ' + (active === index ? 'active' : '')} inert={active !== index} aria-hidden={active !== index} key={slide.key}>
      <MediaImage src={slide.image} eager={index === 0} className="hero-image" />
      <div className="container hero-inner">
        <div className="hero-mark"><span />{slide.eyebrow}</div><h1>{slide.title}</h1><p>{slide.summary}</p>
        <div className="actions"><Link to={slide.primary.href} className="button primary">{slide.primary.label} {slide.arrow}</Link><Link to={slide.secondary.href} className="button outline">{slide.secondary.label}</Link></div>
      </div>
    </article>)}
    {slides.length > 1 && <><button className="slider-control previous" onClick={() => move(-1)} aria-label={fa ? 'اسلاید قبلی' : 'Previous slide'}><ChevronRight /></button><button className="slider-control next" onClick={() => move(1)} aria-label={fa ? 'اسلاید بعدی' : 'Next slide'}><ChevronLeft /></button><div className="slider-dots">{slides.map((slide, index) => <button key={slide.key} className={active === index ? 'active' : ''} onClick={() => setActive(index)} aria-label={`${fa ? 'اسلاید' : 'Slide'} ${index + 1}`} aria-current={active === index ? 'true' : undefined} />)}</div></>}
    {slides.length > 1 && <button className="slider-play" type="button" onClick={() => setPlaying(!playing)}>{playing ? (fa ? 'توقف اسلایدر' : 'Pause slider') : (fa ? 'پخش اسلایدر' : 'Play slider')}</button>}
    <a href="#products" className="scroll-indicator" aria-label={fa ? 'رفتن به محصولات' : 'Scroll to products'}><ArrowDown size={20} /></a>
  </section>;
}
function Home({ data, locale, fa }) {
  const products = useApi(contentUrl(locale, 'PRODUCT'));
  const Arrow = fa ? ArrowUpLeft : ArrowUpRight;
  const slides = [{ key: 'home', image: data.image, title: data.title, summary: data.summary, eyebrow: fa ? 'مهندسی و ساخت صنعتی' : 'Engineering & fabrication', primary: { href: publicPath(locale, 'products'), label: fa ? 'مشاهده محصولات' : 'Explore products' }, secondary: { href: publicPath(locale, 'quote'), label: fa ? 'درخواست پیش‌فاکتور' : 'Request a quotation' }, arrow: <Arrow size={18} /> }, ...(products.data?.entries || []).slice(0, 2).map(({ slug, published }) => ({ key: slug, image: published.image || data.image, title: published.title, summary: published.summary, eyebrow: fa ? 'راهکار منتخب سپاوه صنعت' : 'Featured Sepaveh solution', primary: { href: publicPath(locale, 'products/' + slug), label: fa ? 'مشاهده جزئیات' : 'View details' }, secondary: { href: publicPath(locale, 'quote?product=' + slug), label: fa ? 'دریافت مشاوره' : 'Get advice' }, arrow: <Arrow size={18} /> }))];
  return <>
    <HeroSlider slides={slides} fa={fa} />
    <div className="container section home-products" id="products">
      <div className="section-head"><h2>{fa ? 'محصولات و توانمندی‌ها' : 'Products & capabilities'}</h2><Link to={publicPath(locale, 'products')}>{fa ? 'همه محصولات' : 'All products'} <Arrow size={16} /></Link></div>
      <Cards entries={products.data?.entries?.slice(0, 3)} locale={locale} collection="products" />
      <CatalogShowcase fa={fa} />
      <EquipmentGallery fa={fa} />
      <Blocks blocks={data.blocks} locale={locale} />
    </div>
  </>;
}
function Listing({ locale, fa, collection, query, setQuery }) {
  const [type, en, persian] = collections[collection];
  const page = Number(query.get('page') || 1);
  const result = useApi(contentUrl(locale, type) + '?' + query);
  const categories = useApi(collection === 'products' ? contentUrl(locale, 'PRODUCT_CATEGORY') : null);
  function filter(key, value) {
    const next = new URLSearchParams(query);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setQuery(next);
  }
  return <section className="container section">
    <h1>{fa ? persian : en}</h1>
    {collection === 'products' && <CatalogShowcase fa={fa} />}
    {collection === 'products' && <div className="actions filters">
      <input value={query.get('q') || ''} onChange={(e) => filter('q', e.target.value)} placeholder={fa ? 'جستجو' : 'Search products'} aria-label={fa ? 'جستجو' : 'Search products'} />
      <select value={query.get('category') || ''} onChange={(e) => filter('category', e.target.value)} aria-label={fa ? 'دسته‌بندی' : 'Category'}>
        <option value="">{fa ? 'همه دسته‌ها' : 'All categories'}</option>
        {categories.data?.entries.map(({ slug, published }) => <option key={slug} value={slug}>{published.title}</option>)}
      </select>
      <Link to={publicPath(locale, 'categories')}>{fa ? 'دسته‌بندی‌ها' : 'Browse categories'}</Link>
    </div>}
    {result.isPending || result.isError ? <Status fa={fa} error={result.isError} /> : result.data.total ? <Cards entries={result.data.entries} locale={locale} collection={collection} /> : <p>{fa ? 'موردی پیدا نشد.' : 'No entries found.'}</p>}
    <div className="actions pagination">
      {page > 1 && <button className="button outline" onClick={() => filter('page', page - 1)}>{fa ? 'قبلی' : 'Previous'}</button>}
      {result.data?.total > page * 12 && <button className="button outline" onClick={() => filter('page', page + 1)}>{fa ? 'بعدی' : 'Next'}</button>}
    </div>
  </section>;
}
function Detail({ data, locale, fa, route, slug, query }) {
  const labels = fa ? { client: 'کارفرما', location: 'مکان', completedAt: 'تاریخ اتمام' } : { client: 'Client', location: 'Location', completedAt: 'Completed' };
  const details = [...Object.entries(labels).flatMap(([key, label]) => data[key] ? [[label, data[key]]] : []), ...Object.entries(data.specifications || {})];
  return <section className="container section detail">
    <h1>{data.title}</h1>
    {data.summary && <p className="lead">{data.summary}</p>}
    <MediaImage src={data.image} className="detail-image" eager />
    <p className="prose-copy">{data.body}</p>
    {!!details.length && <dl>{details.map(([key, val]) => <div key={key}><dt>{key}</dt><dd>{val}</dd></div>)}</dl>}
    {data.video && <video src={data.video} controls preload="metadata" />}
    {!!data.gallery?.length && <div className="cards">{data.gallery.map((url) => <MediaImage key={url} src={url} />)}</div>}
    <div className="actions">
      {data.catalog && <a href={data.catalog} className="button outline">{fa ? 'دانلود کاتالوگ' : 'Download catalog'}</a>}
      {route === 'products' && !data.catalog && <CatalogDownload fa={fa} />}
      {route === 'products' && <Link className="button primary" to={publicPath(locale, 'quote?product=' + slug)}>{fa ? 'درخواست پیش‌فاکتور' : 'Request a quotation'}</Link>}
      {route === 'categories' && <Link className="button primary" to={publicPath(locale, 'products?category=' + slug)}>{fa ? 'مشاهده محصولات' : 'View products'}</Link>}
    </div>
    {!!data.related?.length && <ul>{data.related.map((item) => <li key={item}><Link to={publicPath(locale, 'products/' + item)}>{item}</Link></li>)}</ul>}
    <Blocks blocks={data.blocks} locale={locale} />
    {(route === 'contact' || route === 'quote') && <Suspense fallback={<Status fa={fa} />}><Inquiry fa={fa} quote={route === 'quote'} product={query.get('product')} /></Suspense>}
  </section>;
}

export function PublicSite() {
  const { pathname } = useLocation();
  const [query, setQuery] = useSearchParams();
  const [menu, setMenu] = useState(false);
  const [consent, setConsent] = useState(() => localStorage.getItem('analytics-consent'));
  const fa = pathname !== '/en' && !pathname.startsWith('/en/');
  const locale = fa ? 'fa-IR' : 'en-US';
  const path = (fa ? pathname : pathname.slice(3)).replace(/^\/|\/$/g, '');
  const [route, slug, extra] = path.split('/');
  const listing = !extra && Object.hasOwn(collections, route) && collections[route];
  const simple = !slug && (!route || Object.hasOwn(pages, route));
  const settings = useApi(contentUrl(locale, 'SETTINGS', 'site'));
  const menuContent = useApi(contentUrl(locale, 'MENU', 'main'));
  const banner = useApi(!route ? contentUrl(locale, 'BANNER', 'home') : null);
  const appearance = settings.data?.entries[0]?.published;
  const brand = appearance?.title || (fa ? 'سپاوه صنعت نقش جهان' : 'Sepaveh Sanat Naghsh Jahan');
  const content = useApi(simple ? contentUrl(locale, 'PAGE', route || 'home') : listing && slug ? contentUrl(locale, listing[0], slug) : null);
  const data = content.data?.entries[0]?.published;
  const home = publicPath(locale);
  const links = menuContent.data?.entries[0]?.published.links?.map(({ label, target }) => [target, label]) || [['', fa ? 'صفحه اصلی' : 'Home'], ...['about', 'products', 'projects', 'news', 'contact'].map((key) => [key, pages[key]?.[fa ? 1 : 0] ?? collections[key][fa ? 2 : 1]])];
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = fa ? 'rtl' : 'ltr';
    document.title = data?.seoTitle || (data?.title && route ? data.title + ' | ' + brand : brand);
    let description = document.querySelector('meta[name="description"]');
    if (!description) {
      description = document.createElement('meta');
      description.name = 'description';
      document.head.append(description);
    }
    description.content = data?.seoDescription || data?.summary || '';
  }, [locale, fa, brand, data, route]);
  useEffect(() => { if (consent === 'yes') trackVisit(pathname); }, [pathname, consent]);
  function storeConsent(value) {
    localStorage.setItem('analytics-consent', value);
    if (value !== 'yes') localStorage.removeItem('visitor-id');
    setConsent(value);
  }
  let body;
  if (listing && !slug) body = <Listing {...{ locale, fa, collection: route, query, setQuery }} />;
  else if ((simple || listing) && (content.isPending || content.isError)) body = <Status fa={fa} error={content.isError} home={!route} />;
  else if (data && !route) body = <Home {...{ data, locale, fa }} />;
  else if (data) body = <Detail {...{ data, locale, fa, route, slug, query }} />;
  else body = <NotFound {...{ fa, home }} />;
  const notice = banner.data?.entries[0]?.published;
  const quoteLabel = fa ? 'درخواست پیش‌فاکتور' : 'Get a quote';
  return <div className="public-site" style={appearance?.accent ? { '--site-accent': appearance.accent } : undefined}>
    <header className="site-header"><div className="container header-inner">
      <Link className="brand brand-logo" to={home}><img src={appearance?.image || '/brand/sepaveh-logo.webp'} alt={brand} /><span className="sr-only">{brand}</span></Link>
      <button className="menu-toggle" aria-expanded={menu} aria-label={fa ? 'منو' : 'Menu'} onClick={() => setMenu(!menu)}><Menu /></button>
      <nav className={menu ? 'open' : ''} aria-label={fa ? 'منوی اصلی' : 'Main navigation'}>{links.map(([target, label]) => <NavLink key={target} to={publicPath(locale, target)} end={!target} onClick={() => setMenu(false)}>{label}</NavLink>)}{!links.some(([target]) => target === 'quote') && <NavLink className="mobile-cta" to={publicPath(locale, 'quote')} onClick={() => setMenu(false)}>{quoteLabel}</NavLink>}</nav>
      <LanguageSwitcher locale={locale} path={path} query={query} />
      <Link className="button primary header-cta" to={publicPath(locale, 'quote')}>{quoteLabel}</Link>
    </div></header>
    {notice && <div className="site-notice"><div className="container"><strong>{notice.title}</strong>{notice.summary && <span>{notice.summary}</span>}</div></div>}
    <main>{body}</main>
    <footer><div className="container footer-inner"><Link className="brand brand-logo footer-logo" to={home}><img src={appearance?.image || '/brand/sepaveh-logo.webp'} alt={brand} /></Link><Link to={publicPath(locale, 'certificates')}>{fa ? 'گواهینامه‌ها' : 'Certificates'}</Link><Link to={publicPath(locale, 'privacy')}>{fa ? 'حریم خصوصی' : 'Privacy policy'}</Link><button onClick={() => setConsent(null)}>{fa ? 'تنظیمات تحلیل بازدید' : 'Analytics preferences'}</button></div></footer>
    {consent === null && <aside className="consent" aria-label={fa ? 'تنظیمات تحلیل بازدید' : 'Analytics preferences'}><p>{fa ? 'آیا با ثبت آمار ناشناس بازدید موافقید؟' : 'Allow anonymous site analytics?'}</p><div className="actions"><button className="button outline" onClick={() => storeConsent('no')}>{fa ? 'رد' : 'Decline'}</button><button className="button primary" onClick={() => storeConsent('yes')}>{fa ? 'موافقت' : 'Allow'}</button></div></aside>}
  </div>;
}
