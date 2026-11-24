import { Link, Route, Routes } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, useData } from '../app/api';
import { Analytics } from '../features/Analytics';
import { Panel, QueryState } from './Panel';

const links = [['/super-admin', 'Overview'], ['/super-admin/users', 'Administrators'], ['/super-admin/audit', 'Audit log'], ['/super-admin/health', 'System health'], ['/super-admin/analytics', 'Analytics']];
function Users() {
  const path = '/system/users';
  const query = useData(path);
  const cache = useQueryClient();
  const update = useMutation({
    mutationFn: ({ id, ...body }) => id ? api.patch(path + '/' + id, body) : api.post(path, body),
    onSuccess: () => cache.invalidateQueries({ queryKey: [path] }),
  });
  return <><h1>Administrators</h1><form className="form surface" onSubmit={(event) => {
    event.preventDefault();
    const form = event.currentTarget;
    update.mutate(Object.fromEntries(new FormData(form)), { onSuccess: () => form.reset() });
  }}>
    <label>Email<input type="email" name="email" required /></label><label>Initial password<input type="password" autoComplete="new-password" minLength="12" maxLength="128" name="password" required /></label>
    <label>Role<select name="role"><option value="CONTENT_ADMIN">Content Admin</option><option value="SUPER_ADMIN">Super Admin</option></select></label>
    <button className="button primary" disabled={update.isPending}>Create administrator</button>
    {update.isError && <p role="alert">The change failed. Verify the email and account permissions.</p>}
  </form><QueryState query={query}>{(users) => <ul className="admin-list">{users.map(({ id, email, role, active }) => <li className="surface" key={id}>
    <span>{email}</span><small>{role}</small><button className="button outline" disabled={update.isPending} onClick={() => update.mutate({ id, active: !active })}>{active ? 'Disable' : 'Enable'}</button>
  </li>)}</ul>}</QueryState></>;
}
function Audit() {
  const query = useData('/system/audit');
  return <><h1>Audit log</h1><QueryState query={query}>{(items) => <ul className="admin-list">{items.map(({ id, action, actorId, target, createdAt }) => <li className="surface" key={id}><time>{new Date(createdAt).toLocaleString()}</time><strong>{action}</strong><span>Actor {actorId} · Target {target}</span></li>)}</ul>}</QueryState></>;
}
function Health() {
  const query = useData('/system/health');
  return <><h1>System health</h1><QueryState query={query}>{(data) => <dl><div><dt>Database</dt><dd>{data.database}</dd></div><div><dt>API uptime</dt><dd>{data.uptime} seconds</dd></div></dl>}</QueryState></>;
}
export function SuperPanel() {
  return <Panel elevated links={links}><Routes>
    <Route index element={<><h1>System overview</h1><div className="cards"><Link className="surface" to="/super-admin/users">Manage administrators</Link><Link className="surface" to="/super-admin/audit">Review audit activity</Link><Link className="surface" to="/super-admin/health">Check system health</Link></div></>} />
    <Route path="users" element={<Users />} /><Route path="audit" element={<Audit />} /><Route path="health" element={<Health />} /><Route path="analytics" element={<Analytics />} />
    <Route path="*" element={<p>System workspace page not found.</p>} />
  </Routes></Panel>;
}
