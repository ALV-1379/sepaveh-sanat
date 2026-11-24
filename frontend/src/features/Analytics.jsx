import { useState } from 'react';
import { useData } from '../app/api';
import { QueryState } from '../panels/Panel';

export function Analytics() {
  const [range, setRange] = useState('30');
  const [dates, setDates] = useState({});
  const today = new Date().toISOString().slice(0, 10);
  const query = useData(range === 'custom' ? dates.from && dates.to && '/admin/analytics?' + new URLSearchParams(dates) : '/admin/analytics?' + (range === 'today' ? 'from=' + today : 'days=' + range));
  return <><h1>Website analytics</h1><div className="actions filters"><label>Date range<select value={range} onChange={(event) => setRange(event.target.value)}>
    <option value="today">Today (UTC)</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="custom">Custom</option>
  </select></label>{range === 'custom' && ['from', 'to'].map((date) => <label key={date}>{date}<input type="date" onChange={(event) => setDates({ ...dates, [date]: event.target.value })} /></label>)}</div>
  {range === 'custom' && !(dates.from && dates.to) ? <p>Select both dates.</p> : <QueryState query={query}>{(data) => <>
    <div className="cards">{[['Page views', data.views], ['Unique visitors', data.unique], ['Returning visitors', data.returning]].map(([label, value]) => <div className="surface" key={label}><h2>{label}</h2><p className="stat">{value}</p></div>)}</div>
    {Object.entries({ daily: 'Daily visits', pages: 'Top pages', products: 'Top products', projects: 'Top projects', device: 'Devices', browser: 'Browsers', referrers: 'Referrers', conversions: 'Conversions' }).map(([key, label]) => <section className="surface" key={key}><h3>{label}</h3><ul>{data[key].map((row) => {
      const name = row.date || row.path || row.device || row.browser || row.kind || row.referrer || 'Direct';
      return <li key={name}>{name} · {row.views ?? row._count.id ?? row._count.path ?? row._count._all}</li>;
    })}</ul></section>)}
  </>}</QueryState>}</>;
}
