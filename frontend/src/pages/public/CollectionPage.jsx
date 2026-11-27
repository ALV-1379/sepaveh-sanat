import { Link } from 'react-router';
import { useApi } from '../../app/api';
import { CatalogShowcase } from '../../components/common/CatalogShowcase';
import { Cards } from '../../features/Blocks';
import { collections, contentUrl, publicPath } from '../../features/catalog';
import { PageStatus } from './PageStatus';

export function CollectionPage({ locale, fa, collection, query, setQuery }) {
  const [type, en, persian] = collections[collection];
  const page = Number(query.get('page') || 1);
  const result = useApi(contentUrl(locale, type) + '?' + query);
  const categories = useApi(
    collection === 'products' ? contentUrl(locale, 'PRODUCT_CATEGORY') : null,
  );
  function filter(key, value) {
    const next = new URLSearchParams(query);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setQuery(next);
  }
  return (
    <section className="container section">
      <h1>{fa ? persian : en}</h1>
      {collection === 'products' && <CatalogShowcase fa={fa} />}
      {collection === 'products' && (
        <div className="actions filters">
          <input
            value={query.get('q') || ''}
            onChange={(e) => filter('q', e.target.value)}
            placeholder={fa ? 'جستجو' : 'Search products'}
            aria-label={fa ? 'جستجو' : 'Search products'}
          />
          <select
            value={query.get('category') || ''}
            onChange={(e) => filter('category', e.target.value)}
            aria-label={fa ? 'دسته‌بندی' : 'Category'}
          >
            <option value="">{fa ? 'همه دسته‌ها' : 'All categories'}</option>
            {categories.data?.entries.map(({ slug, published }) => (
              <option key={slug} value={slug}>
                {published.title}
              </option>
            ))}
          </select>
          <Link to={publicPath(locale, 'categories')}>
            {fa ? 'دسته‌بندی‌ها' : 'Browse categories'}
          </Link>
        </div>
      )}
      {result.isPending || result.isError ? (
        <PageStatus fa={fa} error={result.isError} />
      ) : result.data.total ? (
        <Cards
          entries={result.data.entries}
          locale={locale}
          collection={collection}
        />
      ) : (
        <p>{fa ? 'موردی پیدا نشد.' : 'No entries found.'}</p>
      )}
      <div className="actions pagination">
        {page > 1 && (
          <button
            className="button outline"
            onClick={() => filter('page', page - 1)}
          >
            {fa ? 'قبلی' : 'Previous'}
          </button>
        )}
        {result.data?.total > page * 12 && (
          <button
            className="button outline"
            onClick={() => filter('page', page + 1)}
          >
            {fa ? 'بعدی' : 'Next'}
          </button>
        )}
      </div>
    </section>
  );
}
