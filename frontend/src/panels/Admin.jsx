import { useState } from 'react';
import { Link, Route, Routes } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, useData } from '../app/api';
import { Analytics } from '../features/Analytics';
import { Editor } from '../features/Editor';
import { Panel, QueryState } from './Panel';

const sections = {
  PAGE: 'Pages', PRODUCT: 'Products', PRODUCT_CATEGORY: 'Product categories', PROJECT: 'Projects',
  PROJECT_CATEGORY: 'Project categories', ARTICLE: 'News & articles', CERTIFICATE: 'Certificates',
  TESTIMONIAL: 'Testimonials', MENU: 'Navigation menus', BANNER: 'Banners', SETTINGS: 'Site appearance',
};
const contentPath = (type) => '/admin/content/' + type;
const links = [['/admin', 'Dashboard'], ...Object.entries(sections).map(([type, label]) => [contentPath(type), label]), ['/admin/media', 'Media library'], ['/admin/inquiries', 'Messages & quotations'], ['/admin/analytics', 'Analytics']];
function Content({ type }) {
  const [editing, setEditing] = useState(false);
  const path = '/admin/content?type=' + type;
  const query = useData(path);
  const cache = useQueryClient();
  const update = useMutation({
    mutationFn: ({ id, action }) => action === 'publish' ? api.post('/admin/content/' + id + '/publish') : api.delete('/admin/content/' + id),
    onSuccess: () => cache.invalidateQueries({ queryKey: [path] }),
  });
  return <><h1>{sections[type]}</h1>{editing ? <Editor entry={editing === true ? undefined : editing} type={type} close={() => setEditing(false)} /> : <>
    <button className="button primary" onClick={() => setEditing(true)}>New entry</button>
    {update.isError && <p role="alert">The change could not be saved.</p>}
    <QueryState query={query}>{(entries) => entries.length ? <ul className="admin-list">{entries.map((entry) => <li className="surface" key={entry.id}>
      <span><strong>{entry.draft.title}</strong> · {entry.locale} · {entry.slug}</span>
      <span>{entry.publishedAt ? 'Published' : 'Draft'}</span>
      <button className="button outline" onClick={() => setEditing(entry)}>Edit</button>
      <button className="button primary" disabled={update.isPending} onClick={() => update.mutate({ id: entry.id, action: 'publish' })}>Publish draft</button>
      <button className="button outline" disabled={update.isPending} onClick={() => { if (window.confirm('Delete this entry and its published version?')) update.mutate({ id: entry.id, action: 'delete' }); }}>Delete</button>
    </li>)}</ul> : <p>No entries yet.</p>}</QueryState>
  </>}</>;
}
function Media() {
  const path = '/admin/media';
  const query = useData(path);
  const cache = useQueryClient();
  const upload = useMutation({ mutationFn: (body) => api.post(path, body), onSuccess: () => cache.invalidateQueries({ queryKey: [path] }) });
  return <><h1>Media library</h1><form className="form surface" onSubmit={(event) => {
    event.preventDefault();
    upload.mutate(new FormData(event.currentTarget));
  }}>
    <label>File<input type="file" name="file" accept="image/jpeg,image/png,image/webp,video/mp4,application/pdf" required /></label>
    <label><span><input type="checkbox" name="public" value="true" /> Make available to public pages</span></label>
    <button className="button primary" disabled={upload.isPending}>Upload</button>
    {upload.isSuccess && <p role="status">Uploaded.</p>}
    {upload.isError && <p role="alert">Upload failed. Verify the file format and size.</p>}
  </form><QueryState query={query}>{(items) => <ul className="admin-list">{items.map(({ id, name, mime, isPublic }) => <li className="surface" key={id}>
    {mime.startsWith('image/') && <img width="80" loading="lazy" src={'/api/admin/media/' + id + '/thumbnail'} alt="" />}
    <a href={'/api/admin/media/' + id}>{name}</a><small>{isPublic ? 'Public' : 'Private'}</small>{isPublic && <code>{'/api/public/media/' + id}</code>}
  </li>)}</ul>}</QueryState></>;
}
function Inquiries() {
  const path = '/admin/inquiries';
  const query = useData(path);
  const cache = useQueryClient();
  const change = useMutation({ mutationFn: ({ id, read }) => api.patch(path + '/' + id, { read }), onSuccess: () => cache.invalidateQueries({ queryKey: [path] }) });
  return <><h1>Messages & quotations</h1>{change.isError && <p role="alert">Could not update message.</p>}<QueryState query={query}>{(items) => items.length ? <div className="admin-list">{items.map(({ id, name, email, message, kind, product, read }) => <article className="surface" key={id}>
    <h2>{kind === 'QUOTE' ? 'Quotation' : 'Contact'} · {name}</h2><p>{email}{product && ' · ' + product}</p><p className="prose-copy">{message}</p>
    <button className="button outline" disabled={change.isPending} onClick={() => change.mutate({ id, read: !read })}>{read ? 'Mark unread' : 'Mark read'}</button>
  </article>)}</div> : <p>No messages yet.</p>}</QueryState></>;
}
export function AdminPanel() {
  return <Panel links={links}><Routes>
    <Route index element={<><h1>Content dashboard</h1><div className="cards"><Link className="surface" to={contentPath('PAGE')}>Manage website pages</Link><Link className="surface" to="/admin/inquiries">Review incoming requests</Link><Link className="surface" to="/admin/analytics">View website analytics</Link></div></>} />
    {Object.keys(sections).map((type) => <Route key={type} path={'content/' + type} element={<Content key={type} type={type} />} />)}
    <Route path="media" element={<Media />} /><Route path="inquiries" element={<Inquiries />} /><Route path="analytics" element={<Analytics />} />
    <Route path="*" element={<p>Content workspace page not found.</p>} />
  </Routes></Panel>;
}
