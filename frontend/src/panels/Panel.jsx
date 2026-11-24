import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, useData } from '../app/api';

export function Panel({ elevated, links, children }) {
  const session = useData('/auth/me');
  const cache = useQueryClient();
  const [failure, setFailure] = useState('');
  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'fa-IR';
    document.title = elevated ? 'مدیریت سامانه' : 'مدیریت محتوا';
  }, [elevated]);
  const signIn = useMutation({
    mutationFn: async (values) => (await api.post('/auth/login', values)).data,
    onSuccess: (user) => { setFailure(''); cache.setQueryData(['/auth/me'], user); },
    onError: () => setFailure('ورود ناموفق بود. ایمیل و رمز عبور را بررسی کنید.'),
  });
  async function signOut() {
    try {
      await api.post('/auth/logout');
      cache.clear();
      cache.setQueryData(['/auth/me'], null);
      setFailure('');
    } catch {
      setFailure('خروج از حساب انجام نشد. دوباره تلاش کنید.');
    }
  }
  const title = elevated ? 'مدیریت سامانه' : 'مدیریت محتوا';
  if (session.isPending) return <p className="login" role="status">در حال بررسی نشست…</p>;
  const user = session.data;
  if (!user) return <div className="login"><h1>{title}</h1><form className="form surface" onSubmit={(event) => {
    event.preventDefault();
    signIn.mutate(Object.fromEntries(new FormData(event.currentTarget)));
  }}>
    <label>ایمیل<input name="email" type="email" autoComplete="username" required /></label>
    <label>رمز عبور<input name="password" type="password" autoComplete="current-password" required /></label>
    {failure && <p role="alert">{failure}</p>}
    <button className="button primary" disabled={signIn.isPending}>{signIn.isPending ? 'در حال ورود…' : 'ورود'}</button>
  </form></div>;
  if (elevated && user.role !== 'SUPER_ADMIN') return <div className="login"><h1>دسترسی محدود</h1><p>این بخش فقط برای مدیر ارشد سامانه در دسترس است.</p><button className="button outline" onClick={signOut}>خروج</button>{failure && <p role="alert">{failure}</p>}</div>;
  return <div className={'admin-shell ' + (elevated ? 'super-shell' : '')}>
    <aside><strong>{title}</strong><nav aria-label={title}>{links.map(([path, label], index) => <NavLink key={path} to={path} end={index === 0}>{label}</NavLink>)}</nav><small dir="ltr">{user.email}</small><button className="button outline" onClick={signOut}>خروج از حساب</button>{failure && <p role="alert">{failure}</p>}</aside>
    <main>{children}</main>
  </div>;
}

export function QueryState({ query, children }) {
  if (query.isPending) return <p role="status">در حال دریافت اطلاعات…</p>;
  if (query.isError) return <p role="alert">دریافت اطلاعات ناموفق بود. صفحه را دوباره بارگذاری کنید.</p>;
  return children(query.data);
}
