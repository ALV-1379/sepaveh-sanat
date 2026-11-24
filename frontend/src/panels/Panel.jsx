import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, useData } from '../app/api';

export function Panel({ elevated, links, children }) {
  const session = useData('/auth/me');
  const cache = useQueryClient();
  const [failure, setFailure] = useState('');
  useEffect(() => {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en-US';
    document.title = elevated ? 'System administration' : 'Content workspace';
  }, [elevated]);
  const signIn = useMutation({
    mutationFn: async (values) => (await api.post('/auth/login', values)).data,
    onSuccess: (user) => { setFailure(''); cache.setQueryData(['/auth/me'], user); },
    onError: () => setFailure('Sign-in failed. Check your credentials and try again.'),
  });
  async function signOut() {
    try {
      await api.post('/auth/logout');
      cache.clear();
      cache.setQueryData(['/auth/me'], null);
      setFailure('');
    } catch {
      setFailure('Sign-out failed. Please try again.');
    }
  }
  const title = elevated ? 'System administration' : 'Content workspace';
  if (session.isPending) return <p className="login" role="status">Checking session…</p>;
  const user = session.data;
  if (!user) return <div className="login"><h1>{title}</h1><form className="form surface" onSubmit={(event) => {
    event.preventDefault();
    signIn.mutate(Object.fromEntries(new FormData(event.currentTarget)));
  }}>
    <label>Email<input name="email" type="email" autoComplete="username" required /></label>
    <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
    {failure && <p role="alert">{failure}</p>}
    <button className="button primary" disabled={signIn.isPending}>Sign in</button>
  </form></div>;
  if (elevated && user.role !== 'SUPER_ADMIN') return <div className="login"><h1>Access restricted</h1><p>This workspace requires a Super Admin account.</p><button className="button outline" onClick={signOut}>Sign out</button>{failure && <p role="alert">{failure}</p>}</div>;
  return <div className={'admin-shell ' + (elevated ? 'super-shell' : '')}>
    <aside><strong>{title}</strong><nav aria-label={title}>{links.map(([path, label], index) => <NavLink key={path} to={path} end={index === 0}>{label}</NavLink>)}</nav><small>{user.email}</small><button className="button outline" onClick={signOut}>Sign out</button>{failure && <p role="alert">{failure}</p>}</aside>
    <main>{children}</main>
  </div>;
}

export function QueryState({ query, children }) {
  if (query.isPending) return <p role="status">Loading…</p>;
  if (query.isError) return <p role="alert">This request failed. Try reloading the page.</p>;
  return children(query.data);
}
