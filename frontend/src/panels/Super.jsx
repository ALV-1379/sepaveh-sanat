import { Link, Route, Routes } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, useData } from '../app/api';
import { Analytics } from '../features/Analytics';
import { Panel, QueryState } from './Panel';

const links = [['/super-admin', 'نمای کلی'], ['/super-admin/users', 'مدیران'], ['/super-admin/audit', 'گزارش فعالیت'], ['/super-admin/health', 'سلامت سامانه'], ['/super-admin/analytics', 'آمار بازدید']];
function Users() {
  const path = '/system/users';
  const query = useData(path);
  const cache = useQueryClient();
  const update = useMutation({
    mutationFn: ({ id, ...body }) => id ? api.patch(path + '/' + id, body) : api.post(path, body),
    onSuccess: () => cache.invalidateQueries({ queryKey: [path] }),
  });
  return <><h1>مدیران سامانه</h1><form className="form surface" onSubmit={(event) => {
    event.preventDefault();
    const form = event.currentTarget;
    update.mutate(Object.fromEntries(new FormData(form)), { onSuccess: () => form.reset() });
  }}>
    <label>ایمیل<input type="email" name="email" required /></label><label>رمز عبور اولیه<input type="password" autoComplete="new-password" minLength="12" maxLength="128" name="password" required /></label>
    <label>نقش<select name="role"><option value="CONTENT_ADMIN">مدیر محتوا</option><option value="SUPER_ADMIN">مدیر ارشد</option></select></label>
    <button className="button primary" disabled={update.isPending}>ایجاد حساب مدیر</button>
    {update.isError && <p role="alert">ایجاد حساب انجام نشد. ایمیل و سطح دسترسی را بررسی کنید.</p>}
  </form><QueryState query={query}>{(users) => <ul className="admin-list">{users.map(({ id, email, role, active }) => <li className="surface" key={id}>
    <span dir="ltr">{email}</span><small>{role === 'SUPER_ADMIN' ? 'مدیر ارشد' : 'مدیر محتوا'}</small><button className="button outline" disabled={update.isPending} onClick={() => update.mutate({ id, active: !active })}>{active ? 'غیرفعال‌کردن' : 'فعال‌کردن'}</button>
  </li>)}</ul>}</QueryState></>;
}
function Audit() {
  const query = useData('/system/audit');
  return <><h1>گزارش فعالیت‌ها</h1><QueryState query={query}>{(items) => <ul className="admin-list">{items.map(({ id, action, actorId, target, createdAt }) => <li className="surface" key={id}><time>{new Date(createdAt).toLocaleString('fa-IR')}</time><strong>{action}</strong><span>کاربر: {actorId} · مقصد: {target}</span></li>)}</ul>}</QueryState></>;
}
function Health() {
  const query = useData('/system/health');
  return <><h1>سلامت سامانه</h1><QueryState query={query}>{(data) => <dl><div><dt>پایگاه داده</dt><dd>{data.database}</dd></div><div><dt>زمان فعالیت API</dt><dd>{data.uptime} ثانیه</dd></div></dl>}</QueryState></>;
}
export function SuperPanel() {
  return <Panel elevated links={links}><Routes>
    <Route index element={<><h1>نمای کلی سامانه</h1><div className="cards"><Link className="surface" to="/super-admin/users">مدیریت حساب مدیران</Link><Link className="surface" to="/super-admin/audit">بررسی فعالیت‌های سامانه</Link><Link className="surface" to="/super-admin/health">بررسی سلامت سامانه</Link></div></>} />
    <Route path="users" element={<Users />} /><Route path="audit" element={<Audit />} /><Route path="health" element={<Health />} /><Route path="analytics" element={<Analytics />} />
    <Route path="*" element={<p>صفحه موردنظر در مدیریت سامانه پیدا نشد.</p>} />
  </Routes></Panel>;
}
