import { lazy, Suspense } from 'react';
import { Link } from 'react-router';
import { CatalogDownload } from '../../components/common/CatalogShowcase';
import { Blocks, MediaImage } from '../../features/Blocks';
import { publicPath } from '../../features/catalog';
import { PageStatus } from './PageStatus';
import { StoneDryingBenefits } from './StoneDryingBenefits';

const Inquiry = lazy(() =>
  import('../../features/Inquiry').then((module) => ({
    default: module.Inquiry,
  })),
);

export function ContentPage({ data, locale, fa, route, slug, query }) {
  const labels = fa
    ? { client: 'کارفرما', location: 'مکان', completedAt: 'تاریخ اتمام' }
    : { client: 'Client', location: 'Location', completedAt: 'Completed' };
  const details = [
    ...Object.entries(labels).flatMap(([key, label]) =>
      data[key] ? [[label, data[key]]] : [],
    ),
    ...Object.entries(data.specifications || {}),
  ];
  return (
    <section className="container section detail">
      <h1>{data.title}</h1>
      {data.summary && <p className="lead">{data.summary}</p>}
      <MediaImage src={data.image} className="detail-image" eager />
      <p className="prose-copy">{data.body}</p>
      {!!details.length && (
        <dl>
          {details.map(([key, val]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{val}</dd>
            </div>
          ))}
        </dl>
      )}
      {data.video && <video src={data.video} controls preload="metadata" />}
      {!!data.gallery?.length && (
        <div className="cards">
          {data.gallery.map((url) => (
            <MediaImage key={url} src={url} />
          ))}
        </div>
      )}
      <div className="actions">
        {data.catalog && (
          <a href={data.catalog} className="button outline">
            {fa ? 'دانلود کاتالوگ' : 'Download catalog'}
          </a>
        )}
        {route === 'products' && !data.catalog && <CatalogDownload fa={fa} />}
        {route === 'products' && (
          <Link
            className="button primary"
            to={publicPath(locale, 'quote?product=' + slug)}
          >
            {fa ? 'درخواست پیش‌فاکتور' : 'Request a quotation'}
          </Link>
        )}
        {route === 'categories' && (
          <Link
            className="button primary"
            to={publicPath(locale, 'products?category=' + slug)}
          >
            {fa ? 'مشاهده محصولات' : 'View products'}
          </Link>
        )}
      </div>
      {!!data.related?.length && (
        <ul>
          {data.related.map((item) => (
            <li key={item}>
              <Link to={publicPath(locale, 'products/' + item)}>{item}</Link>
            </li>
          ))}
        </ul>
      )}
      {route === 'products' &&
        [
          'indirect-stone-dryer',
          'slab-dryer',
          'block-dryer',
          'production-line-dryer',
        ].includes(slug) && (
          <StoneDryingBenefits fa={fa} locale={locale} product={slug} />
        )}
      <Blocks blocks={data.blocks} locale={locale} />
      {(route === 'contact' || route === 'quote') && (
        <Suspense fallback={<PageStatus fa={fa} />}>
          <Inquiry
            fa={fa}
            quote={route === 'quote'}
            product={query.get('product')}
          />
        </Suspense>
      )}
    </section>
  );
}
