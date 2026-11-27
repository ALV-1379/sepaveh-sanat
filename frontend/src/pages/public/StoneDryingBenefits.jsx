import { Link } from 'react-router';
import { publicPath } from '../../features/catalog';

const copy = {
  'fa-IR': {
    title: 'خشک‌کردن کنترل‌شده، سنگ آماده‌تر برای فروش',
    intro:
      'رطوبت باقی‌مانده در سنگ از محموله‌ای به محموله دیگر فرق می‌کند. خشک‌کن مناسب کمک می‌کند سنگ در شرایط قابل‌تکرار برای مرحله بعد آماده شود.',
    benefits: [
      [
        'آماده‌سازی برای رزین‌کاری',
        'کنترل رطوبت پیش از رزین یا توری‌کاری می‌تواند به کاهش دوباره‌کاری کمک کند. دما و زمان را با جنس سنگ و دستورالعمل رزین هماهنگ کنید.',
      ],
      [
        'برنامه‌ریزی بهتر تولید',
        'وقتی خشک‌کردن با ظرفیت خط هماهنگ باشد، زمان آماده‌شدن هر محموله قابل‌پیش‌بینی‌تر می‌شود.',
      ],
      [
        'تحویل سفارش با کیفیت یکنواخت‌تر',
        'محموله‌های یکنواخت‌تر را راحت‌تر می‌توان درجه‌بندی و برای سفارش خریدار آماده کرد. زمان‌بندی قابل‌پیش‌بینی نیز به اعلام موعد تحویل کمک می‌کند.',
      ],
    ],
    action: 'مشاوره برای انتخاب خشک‌کن',
  },
  'en-US': {
    title: 'Controlled drying helps prepare stone for sale',
    intro:
      'Residual moisture varies from batch to batch. A suitable dryer helps bring each batch to more consistent conditions before the next processing step.',
    benefits: [
      [
        'Prepare for resin and mesh backing',
        'Controlling moisture before resin or mesh application can help reduce rework. Match the cycle to the stone and the resin supplier’s instructions.',
      ],
      [
        'Plan production more reliably',
        'Sizing the dryer to the line capacity can make batch turnaround more predictable and simplify scheduling for finishing and packing.',
      ],
      [
        'Offer buyers more consistent batches',
        'More uniform batches are easier to grade and prepare against buyer specifications. Predictable turnaround also helps your team give buyers clearer delivery estimates.',
      ],
    ],
    action: 'Get help choosing a dryer',
  },
};

export function StoneDryingBenefits({ fa, locale, product }) {
  const { title, intro, benefits, action } = copy[fa ? 'fa-IR' : 'en-US'];
  const quotePath = product ? 'quote?product=' + product : 'quote';
  return (
    <section className="block">
      <h2>{title}</h2>
      <p className="prose-copy">{intro}</p>
      <div className="cards">
        {benefits.map(([heading, description]) => (
          <article className="surface" key={heading}>
            <h3>{heading}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>
      <div className="actions">
        <Link className="button primary" to={publicPath(locale, quotePath)}>
          {action}
        </Link>
      </div>
    </section>
  );
}
