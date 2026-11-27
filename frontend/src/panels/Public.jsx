import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { Link, NavLink, useLocation, useSearchParams } from 'react-router';
import { useApi } from '../app/api';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import {
  collections,
  contentUrl,
  pages,
  publicPath,
} from '../features/catalog';
import { trackVisit } from '../features/visits';
import { CollectionPage } from '../pages/public/CollectionPage';
import { ContentPage } from '../pages/public/ContentPage';
import { HomePage } from '../pages/public/HomePage';
import { NotFound, PageStatus } from '../pages/public/PageStatus';

export function PublicSite() {
  const { pathname } = useLocation();
  const [query, setQuery] = useSearchParams();
  const [menu, setMenu] = useState(false);
  const [consent, setConsent] = useState(() =>
    localStorage.getItem('analytics-consent'),
  );
  const fa = pathname !== '/en' && !pathname.startsWith('/en/');
  const locale = fa ? 'fa-IR' : 'en-US';
  const path = (fa ? pathname : pathname.slice(3)).replace(/^\/|\/$/g, '');
  const [route, slug, extra] = path.split('/');
  const listing =
    !extra && Object.hasOwn(collections, route) && collections[route];
  const simple = !slug && (!route || Object.hasOwn(pages, route));
  const settings = useApi(contentUrl(locale, 'SETTINGS', 'site'));
  const menuContent = useApi(contentUrl(locale, 'MENU', 'main'));
  const banner = useApi(!route ? contentUrl(locale, 'BANNER', 'home') : null);
  const appearance = settings.data?.entries[0]?.published;
  const brand =
    appearance?.title ||
    (fa ? 'سپاوه صنعت نقش جهان' : 'Sepaveh Sanat Naghsh Jahan');
  const content = useApi(
    simple
      ? contentUrl(locale, 'PAGE', route || 'home')
      : listing && slug
        ? contentUrl(locale, listing[0], slug)
        : null,
  );
  const data = content.data?.entries[0]?.published;
  const home = publicPath(locale);
  const links = menuContent.data?.entries[0]?.published.links?.map(
    ({ label, target }) => [target, label],
  ) || [
    ['', fa ? 'صفحه اصلی' : 'Home'],
    ...['about', 'products', 'projects', 'news', 'contact'].map((key) => [
      key,
      pages[key]?.[fa ? 1 : 0] ?? collections[key][fa ? 2 : 1],
    ]),
  ];
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = fa ? 'rtl' : 'ltr';
    document.title =
      data?.seoTitle ||
      (data?.title && route ? data.title + ' | ' + brand : brand);
    let description = document.querySelector('meta[name="description"]');
    if (!description) {
      description = document.createElement('meta');
      description.name = 'description';
      document.head.append(description);
    }
    description.content = data?.seoDescription || data?.summary || '';
  }, [locale, fa, brand, data, route]);
  useEffect(() => {
    if (consent === 'yes') trackVisit(pathname);
  }, [pathname, consent]);
  function storeConsent(value) {
    localStorage.setItem('analytics-consent', value);
    if (value !== 'yes') localStorage.removeItem('visitor-id');
    setConsent(value);
  }
  let body;
  if (listing && !slug)
    body = (
      <CollectionPage {...{ locale, fa, collection: route, query, setQuery }} />
    );
  else if ((simple || listing) && (content.isPending || content.isError))
    body = <PageStatus fa={fa} error={content.isError} home={!route} />;
  else if (data && !route) body = <HomePage {...{ data, locale, fa }} />;
  else if (data)
    body = <ContentPage {...{ data, locale, fa, route, slug, query }} />;
  else body = <NotFound {...{ fa, home }} />;
  const notice = banner.data?.entries[0]?.published;
  const quoteLabel = fa ? 'درخواست پیش‌فاکتور' : 'Get a quote';
  return (
    <div
      className="public-site"
      style={
        appearance?.accent ? { '--site-accent': appearance.accent } : undefined
      }
    >
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand brand-logo" to={home}>
            <img
              src={appearance?.image || '/brand/sepaveh-logo.webp'}
              alt={brand}
            />
            <span className="sr-only">{brand}</span>
          </Link>
          <button
            className="menu-toggle"
            aria-expanded={menu}
            aria-label={fa ? 'منو' : 'Menu'}
            onClick={() => setMenu(!menu)}
          >
            <Menu />
          </button>
          <nav
            className={menu ? 'open' : ''}
            aria-label={fa ? 'منوی اصلی' : 'Main navigation'}
          >
            {links.map(([target, label]) => (
              <NavLink
                key={target}
                to={publicPath(locale, target)}
                end={!target}
                onClick={() => setMenu(false)}
              >
                {label}
              </NavLink>
            ))}
            {!links.some(([target]) => target === 'quote') && (
              <NavLink
                className="mobile-cta"
                to={publicPath(locale, 'quote')}
                onClick={() => setMenu(false)}
              >
                {quoteLabel}
              </NavLink>
            )}
          </nav>
          <LanguageSwitcher locale={locale} path={path} query={query} />
          <Link
            className="button primary header-cta"
            to={publicPath(locale, 'quote')}
          >
            {quoteLabel}
          </Link>
        </div>
      </header>
      {notice && (
        <div className="site-notice">
          <div className="container">
            <strong>{notice.title}</strong>
            {notice.summary && <span>{notice.summary}</span>}
          </div>
        </div>
      )}
      <main>{body}</main>
      <footer>
        <div className="container footer-inner">
          <Link className="brand brand-logo footer-logo" to={home}>
            <img
              src={appearance?.image || '/brand/sepaveh-logo.webp'}
              alt={brand}
            />
          </Link>
          <Link to={publicPath(locale, 'certificates')}>
            {fa ? 'گواهینامه‌ها' : 'Certificates'}
          </Link>
          <Link to={publicPath(locale, 'privacy')}>
            {fa ? 'حریم خصوصی' : 'Privacy policy'}
          </Link>
          <button onClick={() => setConsent(null)}>
            {fa ? 'تنظیمات تحلیل بازدید' : 'Analytics preferences'}
          </button>
        </div>
      </footer>
      {consent === null && (
        <aside
          className="consent"
          aria-label={fa ? 'تنظیمات تحلیل بازدید' : 'Analytics preferences'}
        >
          <p>
            {fa
              ? 'آیا با ثبت آمار ناشناس بازدید موافقید؟'
              : 'Allow anonymous site analytics?'}
          </p>
          <div className="actions">
            <button
              className="button outline"
              onClick={() => storeConsent('no')}
            >
              {fa ? 'رد' : 'Decline'}
            </button>
            <button
              className="button primary"
              onClick={() => storeConsent('yes')}
            >
              {fa ? 'موافقت' : 'Allow'}
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
