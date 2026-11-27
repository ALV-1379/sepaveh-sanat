import { Link } from 'react-router';

export function PageStatus({ fa, error, home }) {
  return (
    <div
      className={
        home && !error ? 'home-loading container section' : 'container section'
      }
      role={error ? 'alert' : 'status'}
    >
      {error
        ? fa
          ? 'محتوا در دسترس نیست.'
          : 'Content is temporarily unavailable.'
        : fa
          ? 'در حال بارگذاری…'
          : 'Loading…'}
    </div>
  );
}
export function NotFound({ fa, home }) {
  return (
    <section className="container section">
      <h1>404</h1>
      <p>{fa ? 'صفحه پیدا نشد.' : 'This page could not be found.'}</p>
      <Link className="button primary" to={home}>
        {fa ? 'صفحه اصلی' : 'Back to home'}
      </Link>
    </section>
  );
}
