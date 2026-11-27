import { lazy, Suspense } from 'react';
import { Link } from 'react-router';
import { useData } from '../app/api';
import { contentUrl, publicPath } from './catalog';
const Inquiry = lazy(() =>
  import('./Inquiry').then((module) => ({ default: module.Inquiry })),
);

export const blockTypes = [
  'hero',
  'image-text',
  'video',
  'products',
  'projects',
  'statistics',
  'testimonials',
  'certificates',
  'cta',
  'contact',
  'features',
  'rich-text',
];
const feeds = {
  products: 'PRODUCT',
  projects: 'PROJECT',
  testimonials: 'TESTIMONIAL',
  certificates: 'CERTIFICATE',
};

export function MediaImage({
  src,
  className,
  eager = false,
  thumbnail = false,
}) {
  if (!src) return null;
  const original = /^\/api\/public\/media\/[\da-f-]{36}$/i.test(src);
  const preferred = thumbnail && original ? src + '/thumbnail' : src;
  return (
    <img
      className={className}
      src={preferred}
      alt=""
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : 'auto'}
    />
  );
}
export function Cards({ entries = [], locale, collection }) {
  return (
    <div className="cards">
      {entries.map(({ slug, published: item }) => (
        <Link
          className="card"
          to={publicPath(locale, collection + '/' + slug)}
          key={slug}
        >
          <MediaImage src={item.image} thumbnail />
          <div>
            <h3>{item.title}</h3>
            {item.summary && <p>{item.summary}</p>}
          </div>
        </Link>
      ))}
    </div>
  );
}
function Block({ block, locale }) {
  const fa = locale === 'fa-IR';
  const feed = feeds[block.type];
  const result = useData(feed && contentUrl(locale, feed));
  return (
    <section className={block.type === 'hero' ? 'hero block' : 'block'}>
      {block.media && block.type !== 'video' && (
        <MediaImage src={block.media} />
      )}
      {block.title && <h2>{block.title}</h2>}
      {block.body && <p className="prose-copy">{block.body}</p>}
      {block.type === 'video' && block.media && (
        <video controls preload="metadata" src={block.media} />
      )}
      {!!block.items?.length && (
        <div className="cards">
          {block.items.map((item, index) => (
            <div className="surface" key={index}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      )}
      {feed === 'TESTIMONIAL'
        ? result.data?.entries.map(({ slug, published }) => (
            <blockquote key={slug}>
              {published.body}
              <cite>{published.title}</cite>
            </blockquote>
          ))
        : feed && (
            <Cards
              entries={result.data?.entries}
              locale={locale}
              collection={block.type}
            />
          )}
      {block.type === 'cta' && (
        <Link className="button primary" to={publicPath(locale, 'quote')}>
          {fa ? 'درخواست پیش‌فاکتور' : 'Request a quotation'}
        </Link>
      )}
      {block.type === 'contact' && (
        <Suspense fallback={null}>
          <Inquiry fa={fa} />
        </Suspense>
      )}
    </section>
  );
}
export function Blocks({ blocks = [], locale }) {
  return blocks
    .filter((block) => block.enabled)
    .map((block) => <Block key={block.id} block={block} locale={locale} />);
}
