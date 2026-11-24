import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, useData } from '../app/api';
import { Blocks, blockTypes, MediaImage } from './Blocks';

const textFields = {
  summary: 'Summary', body: 'Body', category: 'Category slug', parent: 'Parent category slug',
  client: 'Client', location: 'Location', completedAt: 'Completion date', seoTitle: 'SEO title', seoDescription: 'SEO description', accent: 'Accent color (#RRGGBB)',
};
const lists = { gallery: 'Gallery media URLs', related: 'Related product slugs' };
export function reorder(list, from, to) {
  if (from < 0 || to < 0 || from >= list.length || to >= list.length || from === to) return list;
  const copy = [...list];
  copy.splice(to, 0, copy.splice(from, 1)[0]);
  return copy;
}
function AssetPicker({ label, value, onChange, media = [], accept }) {
  return <label>{label}<select value={value || ''} onChange={(event) => onChange(event.target.value || undefined)}>
    <option value="">None</option>
    {value && !media.some((item) => '/api/public/media/' + item.id === value) && <option value={value}>{value}</option>}
    {media.filter((item) => item.isPublic && item.mime.startsWith(accept)).map(({ id, name }) => <option key={id} value={'/api/public/media/' + id}>{name}</option>)}
  </select></label>;
}
function Builder({ blocks, update, media }) {
  const [type, setType] = useState('hero');
  const [drag, setDrag] = useState(-1);
  function change(id, key, value) {
    update(blocks.map((item) => item.id === id ? { ...item, [key]: value } : item));
  }
  return <fieldset className="surface"><legend>Page sections</legend>
    {blocks.map((block, index) => <article className="surface" key={block.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
      event.preventDefault();
      update(reorder(blocks, drag, index));
      setDrag(-1);
    }}>
      <div className="actions"><strong draggable onDragStart={(event) => { setDrag(index); event.dataTransfer.setData('text/plain', block.id); }} onDragEnd={() => setDrag(-1)}>{block.type}</strong>
        <button type="button" onClick={() => update(reorder(blocks, index, index - 1))} disabled={!index}>Move up</button>
        <button type="button" onClick={() => update(reorder(blocks, index, index + 1))} disabled={index === blocks.length - 1}>Move down</button>
        <button type="button" onClick={() => update([...blocks.slice(0, index + 1), { ...block, id: crypto.randomUUID() }, ...blocks.slice(index + 1)])}>Duplicate</button>
        <button type="button" onClick={() => update(blocks.filter((item) => item.id !== block.id))}>Remove</button>
        <label><span><input type="checkbox" checked={block.enabled} onChange={(event) => change(block.id, 'enabled', event.target.checked)} /> Visible</span></label>
      </div>
      <label>Heading<input value={block.title || ''} onChange={(event) => change(block.id, 'title', event.target.value)} /></label>
      <label>Body<textarea rows="3" value={block.body || ''} onChange={(event) => change(block.id, 'body', event.target.value)} /></label>
      <AssetPicker label="Media" value={block.media} media={media} accept={block.type === 'video' ? 'video/' : 'image/'} onChange={(value) => change(block.id, 'media', value)} />
      {['statistics', 'features'].includes(block.type) && <>
        {(block.items || []).map((item, itemIndex) => <div className="actions" key={itemIndex}>
          {['title', 'body'].map((key) => <label key={key}>{key}<input value={item[key]} onChange={(event) => change(block.id, 'items', block.items.map((entry, position) => position === itemIndex ? { ...entry, [key]: event.target.value } : entry))} /></label>)}
          <button type="button" onClick={() => change(block.id, 'items', block.items.filter((_, position) => position !== itemIndex))}>Remove item</button>
        </div>)}
        <button type="button" onClick={() => change(block.id, 'items', [...(block.items || []), { title: '', body: '' }])}>Add item</button>
      </>}
    </article>)}
    <div className="actions"><select aria-label="Section type" value={type} onChange={(event) => setType(event.target.value)}>{blockTypes.map((item) => <option key={item}>{item}</option>)}</select>
      <button type="button" className="button outline" onClick={() => update([...blocks, { id: crypto.randomUUID(), type, enabled: true }])}>Add section</button></div>
  </fieldset>;
}

export function Editor({ entry, type, close }) {
  const [draft, setDraft] = useState(entry?.draft || { title: '' });
  const [slug, setSlug] = useState(entry?.slug || '');
  const [locale, setLocale] = useState(entry?.locale || 'fa-IR');
  const [preview, setPreview] = useState(false);
  const [problem, setProblem] = useState('');
  const cache = useQueryClient();
  const assets = useData('/admin/media');
  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const save = useMutation({
    mutationFn: async (payload) => {
      const response = entry ? await api.put('/admin/content/' + entry.id, payload) : await api.post('/admin/content', payload);
      return response.data;
    },
    onSuccess: () => { cache.invalidateQueries({ queryKey: ['/admin/content?type=' + type] }); close(); },
    onError: (error) => setProblem(error.response?.data?.issues?.map(({ path, message }) => path.join('.') + ' — ' + message).join(', ') || 'Could not save draft. Verify the slug is unique.'),
  });
  const isProduct = type === 'PRODUCT';
  const isProject = type === 'PROJECT';
  const fields = ['summary', 'body', 'seoTitle', 'seoDescription'];
  if (isProject) fields.push('category', 'client', 'location', 'completedAt');
  if (isProduct) fields.push('category');
  if (type.endsWith('_CATEGORY')) fields.push('parent');
  if (type === 'SETTINGS') fields.push('accent');
  function submit(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const extras = Object.fromEntries(Object.keys(lists).filter((key) => values.has(key)).map((key) => [key, values.get(key).split(/\r?\n/).map((value) => value.trim()).filter(Boolean)]));
    try {
      if (values.has('links')) extras.links = values.get('links').split(/\r?\n/).filter(Boolean).map((line) => {
        const separator = line.indexOf('|');
        if (separator < 0) throw new Error('Provide each menu link as Label | path.');
        return { label: line.slice(0, separator).trim(), target: line.slice(separator + 1).trim() };
      });
      if (values.has('specifications')) extras.specifications = JSON.parse(values.get('specifications') || '{}');
    } catch (error) {
      setProblem(error instanceof SyntaxError ? 'Specifications must be a JSON object.' : error.message);
      return;
    }
    save.mutate({ type, slug, locale, draft: { ...draft, ...extras } });
  }
  return <div className="editor"><div className="section-head"><h2>{entry ? 'Edit draft' : 'New entry'}</h2><button className="button outline" onClick={close}>Close editor</button></div>
    <form className="form" onSubmit={submit}>
      <div className="surface">
        <label>Title<input required value={draft.title} onChange={(event) => update('title', event.target.value)} /></label>
        <label>Slug<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug} readOnly={!!entry?.publishedAt} onChange={(event) => setSlug(event.target.value)} /></label>
        <label>Language<select value={locale} disabled={!!entry?.publishedAt} onChange={(event) => setLocale(event.target.value)}><option value="fa-IR">Persian</option><option value="en-US">English</option></select></label>
        {fields.map((key) => <label key={key}>{textFields[key]}{key === 'body' || key === 'summary' ? <textarea value={draft[key] || ''} onChange={(event) => update(key, event.target.value || undefined)} /> : <input type={key === 'completedAt' ? 'date' : 'text'} value={draft[key] || ''} onChange={(event) => update(key, event.target.value || undefined)} />}</label>)}
        <AssetPicker label="Main image" value={draft.image} media={assets.data} accept="image/" onChange={(value) => update('image', value)} />
        {type === 'MENU' && <label>Menu links (one Label | path per line)<textarea name="links" defaultValue={draft.links?.map(({ label, target }) => label + ' | ' + target).join('\n')} /></label>}
        {isProject && <AssetPicker label="Video" value={draft.video} media={assets.data} accept="video/" onChange={(value) => update('video', value)} />}
        {isProduct && <AssetPicker label="PDF catalog" value={draft.catalog} media={assets.data} accept="application/pdf" onChange={(value) => update('catalog', value)} />}
        {(isProduct || isProject) && <label>{lists.gallery}<textarea name="gallery" defaultValue={draft.gallery?.join('\n')} /></label>}
        {isProduct && <><label>{lists.related}<textarea name="related" defaultValue={draft.related?.join('\n')} /></label><label>Specifications (JSON object)<textarea name="specifications" rows="4" defaultValue={JSON.stringify(draft.specifications || {}, null, 2)} /></label></>}
      </div>
      {type === 'PAGE' && <Builder blocks={draft.blocks || []} update={(value) => update('blocks', value)} media={assets.data} />}
      {problem && <p role="alert">{problem}</p>}
      <div className="actions"><button className="button primary" disabled={save.isPending}>Save draft</button><button type="button" className="button outline" onClick={() => setPreview(!preview)}>{preview ? 'Hide preview' : 'Preview draft'}</button></div>
    </form>
    {preview && <section className="surface" dir={locale === 'fa-IR' ? 'rtl' : 'ltr'} lang={locale}><h2>{draft.title}</h2><MediaImage src={draft.image} /><p className="prose-copy">{draft.summary}</p><p className="prose-copy">{draft.body}</p><Blocks blocks={draft.blocks} locale={locale} /></section>}
  </div>;
}
