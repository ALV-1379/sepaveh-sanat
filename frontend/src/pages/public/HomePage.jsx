import { ArrowUpLeft, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';
import { useApi } from '../../app/api';
import {
  CatalogShowcase,
  EquipmentGallery,
} from '../../components/common/CatalogShowcase';
import { Blocks, Cards } from '../../features/Blocks';
import { contentUrl, publicPath } from '../../features/catalog';
import { HeroSlider } from './HeroSlider';
import { StoneDryingBenefits } from './StoneDryingBenefits';

export function HomePage({ data, locale, fa }) {
  const products = useApi(contentUrl(locale, 'PRODUCT'));
  const Arrow = fa ? ArrowUpLeft : ArrowUpRight;
  const slides = [
    {
      key: 'home',
      image: data.image,
      title: data.title,
      summary: data.summary,
      eyebrow: fa ? 'مهندسی و ساخت صنعتی' : 'Engineering & fabrication',
      primary: {
        href: publicPath(locale, 'products'),
        label: fa ? 'مشاهده محصولات' : 'Explore products',
      },
      secondary: {
        href: publicPath(locale, 'quote'),
        label: fa ? 'درخواست پیش‌فاکتور' : 'Request a quotation',
      },
      arrow: <Arrow size={18} />,
    },
    ...(products.data?.entries || [])
      .slice(0, 2)
      .map(({ slug, published }) => ({
        key: slug,
        image: published.image || data.image,
        title: published.title,
        summary: published.summary,
        eyebrow: fa ? 'راهکار منتخب سپاوه صنعت' : 'Featured Sepaveh solution',
        primary: {
          href: publicPath(locale, 'products/' + slug),
          label: fa ? 'مشاهده جزئیات' : 'View details',
        },
        secondary: {
          href: publicPath(locale, 'quote?product=' + slug),
          label: fa ? 'دریافت مشاوره' : 'Get advice',
        },
        arrow: <Arrow size={18} />,
      })),
  ];
  return (
    <>
      <HeroSlider slides={slides} fa={fa} />
      <div className="container section home-products" id="products">
        <div className="section-head">
          <h2>{fa ? 'محصولات و توانمندی‌ها' : 'Products & capabilities'}</h2>
          <Link to={publicPath(locale, 'products')}>
            {fa ? 'همه محصولات' : 'All products'} <Arrow size={16} />
          </Link>
        </div>
        <Cards
          entries={products.data?.entries?.slice(0, 3)}
          locale={locale}
          collection="products"
        />
        <StoneDryingBenefits fa={fa} locale={locale} />
        <CatalogShowcase fa={fa} />
        <EquipmentGallery fa={fa} />
        <Blocks blocks={data.blocks} locale={locale} />
      </div>
    </>
  );
}
