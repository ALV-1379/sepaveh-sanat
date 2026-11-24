import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowDown, ArrowUpLeft, ArrowUpRight, Factory, Globe2, Menu } from 'lucide-react';
import { Link, NavLink, useLocation, useSearchParams } from 'react-router';
import { useData } from '../app/api';
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
function Home({ data, locale, fa }) {
  const products = useData(contentUrl(locale, 'PRODUCT'));
  const Arrow = fa ? ArrowUpLeft : ArrowUpRight;
  return <>
    <section className="hero">
      <MediaImage src={data.image} eager className="hero-image" />
      <div className="container hero-inner">
        <div className="hero-mark"><span />{fa ? 'مهندسی و ساخت صنعتی' : 'Engineering & fabrication'}</div>
        <h1>{data.title}</h1>
        <p>{data.summary}</p>
        <div className="actions"><Link to={publicPath(locale, 'products')} className="button primary">{fa ? 'مشاهده محصولات' : 'Explore products'} <Arrow size={18} /></Link><Link to={publicPath(locale, 'quote')} className="button outline">{fa ? 'درخواست پیش‌فاکتور' : 'Request a quotation'}</Link></div>
      </div>
      <a href="#products" className="scroll-indicator" aria-label={fa ? 'رفتن به محصولات' : 'Scroll to products'}><ArrowDown size={20} /></a>
    </section>
    <div className="container section home-products" id="products">
      <div className="section-head"><h2>{fa ? 'محصولات و توانمندی‌ها' : 'Products & capabilities'}</h2><Link to={publicPath(locale, 'products')}>{fa ? 'همه محصولات' : 'All products'} <Arrow size={16} /></Link></div>
      <Cards entries={products.data?.entries?.slice(0, 3)} locale={locale} collection="products" />
      <Blocks blocks={data.blocks} locale={locale} />
    </div>
  </>;
}
function Listing({ locale, fa, collection, query, setQuery }) {
  const [type, en, persian] = collections[collection];
  const page = Number(query.get('page') || 1);
  const result = useData(contentUrl(locale, type) + '?' + query);
  const categories = useData(collection === 'products' ? contentUrl(locale, 'PRODUCT_CATEGORY') : null);
  function filter(key, value) {
    const next = new URLSearchParams(query);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setQuery(next);
  }
  return <section className="container section">
    <h1>{fa ? persian : en}</h1>
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
  const settings = useData(contentUrl(locale, 'SETTINGS', 'site'));
  const menuContent = useData(contentUrl(locale, 'MENU', 'main'));
  const banner = useData(!route ? contentUrl(locale, 'BANNER', 'home') : null);
  const appearance = settings.data?.entries[0]?.published;
  const brand = appearance?.title || (fa ? 'سپاوِه صنعت' : 'Sepawe Sanat');
  const content = useData(simple ? contentUrl(locale, 'PAGE', route || 'home') : listing && slug ? contentUrl(locale, listing[0], slug) : null);
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
  return <div className="public-site" style={appearance?.accent ? { '--site-accent': appearance.accent } : undefined}>
    <header className="site-header"><div className="container header-inner">
      <Link className="brand" to={home}><span>{appearance?.image ? <img src={appearance.image} width="38" height="38" alt="" /> : <Factory size={24} />}</span>{brand}</Link>
      <button className="menu-toggle" aria-expanded={menu} aria-label={fa ? 'منو' : 'Menu'} onClick={() => setMenu(!menu)}><Menu /></button>
      <nav className={menu ? 'open' : ''} aria-label={fa ? 'منوی اصلی' : 'Main navigation'}>{links.map(([target, label]) => <NavLink key={target} to={publicPath(locale, target)} end={!target} onClick={() => setMenu(false)}>{label}</NavLink>)}</nav>
      <Link className="language" to={publicPath(fa ? 'en-US' : 'fa-IR', path) + (query.size ? '?' + query : '')}><Globe2 size={16} /> {fa ? 'EN' : 'FA'}</Link>
      <Link className="button primary header-cta" to={publicPath(locale, 'quote')}>{fa ? 'درخواست پیش‌فاکتور' : 'Get a quote'}</Link>
    </div></header>
    {notice && <div className="site-notice"><div className="container"><strong>{notice.title}</strong>{notice.summary && <span>{notice.summary}</span>}</div></div>}
    <main>{body}</main>
    <footer><div className="container footer-inner"><span className="brand"><Factory size={20} /> {brand}</span><Link to={publicPath(locale, 'certificates')}>{fa ? 'گواهینامه‌ها' : 'Certificates'}</Link><Link to={publicPath(locale, 'privacy')}>{fa ? 'حریم خصوصی' : 'Privacy policy'}</Link><button onClick={() => setConsent(null)}>{fa ? 'تنظیمات تحلیل بازدید' : 'Analytics preferences'}</button></div></footer>
    {consent === null && <aside className="consent" aria-label={fa ? 'تنظیمات تحلیل بازدید' : 'Analytics preferences'}><p>{fa ? 'آیا با ثبت آمار ناشناس بازدید موافقید؟' : 'Allow anonymous site analytics?'}</p><div className="actions"><button className="button outline" onClick={() => storeConsent('no')}>{fa ? 'رد' : 'Decline'}</button><button className="button primary" onClick={() => storeConsent('yes')}>{fa ? 'موافقت' : 'Allow'}</button></div></aside>}
  </div>;
}
