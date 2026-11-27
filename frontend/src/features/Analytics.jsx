import { useState } from 'react';
import { useData } from '../app/api';
import { QueryState } from '../panels/Panel';

export function Analytics() {
  const [range, setRange] = useState('30');
  const [dates, setDates] = useState({});
  const today = new Date().toISOString().slice(0, 10);
  const query = useData(
    range === 'custom'
      ? dates.from &&
          dates.to &&
          '/admin/analytics?' + new URLSearchParams(dates)
      : '/admin/analytics?' +
          (range === 'today' ? 'from=' + today : 'days=' + range),
  );
  const dateLabels = { from: 'از تاریخ', to: 'تا تاریخ' };
  return (
    <>
      <h1>آمار وب‌سایت</h1>
      <div className="actions filters">
        <label>
          بازه زمانی
          <select
            value={range}
            onChange={(event) => setRange(event.target.value)}
          >
            <option value="today">امروز</option>
            <option value="7">۷ روز گذشته</option>
            <option value="30">۳۰ روز گذشته</option>
            <option value="90">۹۰ روز گذشته</option>
            <option value="custom">بازه دلخواه</option>
          </select>
        </label>
        {range === 'custom' &&
          ['from', 'to'].map((date) => (
            <label key={date}>
              {dateLabels[date]}
              <input
                type="date"
                onChange={(event) =>
                  setDates({ ...dates, [date]: event.target.value })
                }
              />
            </label>
          ))}
      </div>
      {range === 'custom' && !(dates.from && dates.to) ? (
        <p>هر دو تاریخ را انتخاب کنید.</p>
      ) : (
        <QueryState query={query}>
          {(data) => (
            <>
              <div className="cards">
                {[
                  ['بازدید صفحات', data.views],
                  ['بازدیدکنندگان یکتا', data.unique],
                  ['بازدیدکنندگان بازگشتی', data.returning],
                ].map(([label, value]) => (
                  <div className="surface" key={label}>
                    <h2>{label}</h2>
                    <p className="stat">{value}</p>
                  </div>
                ))}
              </div>
              {Object.entries({
                daily: 'بازدید روزانه',
                pages: 'صفحات پربازدید',
                products: 'محصولات پربازدید',
                projects: 'پروژه‌های پربازدید',
                device: 'دستگاه‌ها',
                browser: 'مرورگرها',
                referrers: 'منابع ورودی',
                conversions: 'تبدیل‌ها',
              }).map(([key, label]) => (
                <section className="surface" key={key}>
                  <h3>{label}</h3>
                  <ul>
                    {data[key].map((row) => {
                      const name =
                        row.date ||
                        row.path ||
                        row.device ||
                        row.browser ||
                        row.kind ||
                        row.referrer ||
                        'ورود مستقیم';
                      return (
                        <li key={name}>
                          {name} ·{' '}
                          {row.views ??
                            row._count.id ??
                            row._count.path ??
                            row._count._all}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </>
          )}
        </QueryState>
      )}
    </>
  );
}
