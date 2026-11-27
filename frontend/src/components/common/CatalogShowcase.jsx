import { Download } from 'lucide-react';

const catalog = '/showcase/catalog-sepaveh-sanat-naghsh-jahan.pdf';
const photos = [2476, 2491, 2495, 2501, 2504, 2506];

export function CatalogDownload({ fa }) {
  return <a className="button primary" href={catalog} download>
    <Download size={18} aria-hidden="true" />
    {fa ? 'دانلود کاتالوگ (PDF)' : 'Download catalog (PDF)'}
  </a>;
}

export function CatalogShowcase({ fa }) {
  return <section className="catalog-showcase">
    <img src="/showcase/catalog-cover.jpg" alt="" loading="lazy" />
    <div>
      <h2>{fa ? 'کاتالوگ محصولات سپاوه صنعت' : 'Sepaveh Sanat product catalog'}</h2>
      <p>{fa ? 'با خشک‌کن‌های سنگ، تجهیزات تهویه و نمونه‌های نصب‌شده آشنا شوید.' : 'Browse stone dryers, ventilation equipment, and installation examples in the Persian-language catalog.'}</p>
      <CatalogDownload fa={fa} />
    </div>
  </section>;
}

export function EquipmentGallery({ fa }) {
  return <section className="equipment-gallery">
    <h2>{fa ? 'گالری تصاویر سپاوه صنعت' : 'Sepaveh Sanat photo gallery'}</h2>
    <div className="equipment-photos">
      {photos.map((id, index) => {
        const src = '/showcase/IMG_' + id + '.webp';
        const label = fa ? `نمایش عکس ${index + 1}` : `View photo ${index + 1}`;
        return <a key={id} href={src} aria-label={label}><img src={src} alt="" loading="lazy" decoding="async" /></a>;
      })}
    </div>
  </section>;
}
