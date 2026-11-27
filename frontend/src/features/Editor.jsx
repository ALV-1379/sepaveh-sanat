import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, useData } from '../app/api';
import { Blocks, blockTypes, MediaImage } from './Blocks';

const textFields = {
  summary: 'خلاصه',
  body: 'متن',
  category: 'شناسه دسته‌بندی',
  parent: 'شناسه دسته‌بندی والد',
  client: 'کارفرما',
  location: 'محل اجرا',
  completedAt: 'تاریخ تکمیل',
  seoTitle: 'عنوان سئو',
  seoDescription: 'توضیحات سئو',
  accent: 'رنگ اصلی (#RRGGBB)',
};
const lists = {
  gallery: 'نشانی تصاویر گالری (هر سطر یک نشانی)',
  related: 'شناسه محصولات مرتبط (هر سطر یک شناسه)',
};
const typeLabels = {
  hero: 'بخش قهرمان',
  'image-text': 'تصویر و متن',
  video: 'ویدئو',
  products: 'محصولات',
  projects: 'پروژه‌ها',
  statistics: 'آمار',
  testimonials: 'دیدگاه مشتریان',
  certificates: 'گواهینامه‌ها',
  cta: 'دعوت به اقدام',
  contact: 'فرم تماس',
  features: 'ویژگی‌ها',
  'rich-text': 'متن کامل',
};
export function reorder(list, from, to) {
  if (
    from < 0 ||
    to < 0 ||
    from >= list.length ||
    to >= list.length ||
    from === to
  )
    return list;
  const copy = [...list];
  copy.splice(to, 0, copy.splice(from, 1)[0]);
  return copy;
}
function AssetPicker({ label, value, onChange, media = [], accept }) {
  return (
    <label>
      {label}
      <select
        value={value || ''}
        onChange={(event) => onChange(event.target.value || undefined)}
      >
        <option value="">بدون انتخاب</option>
        {value &&
          !media.some((item) => '/api/public/media/' + item.id === value) && (
            <option value={value}>{value}</option>
          )}
        {media
          .filter((item) => item.isPublic && item.mime.startsWith(accept))
          .map(({ id, name }) => (
            <option key={id} value={'/api/public/media/' + id}>
              {name}
            </option>
          ))}
      </select>
    </label>
  );
}
function Builder({ blocks, update, media }) {
  const [type, setType] = useState('hero');
  const [drag, setDrag] = useState(-1);
  function change(id, key, value) {
    update(
      blocks.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    );
  }
  return (
    <fieldset className="surface">
      <legend>بخش‌های صفحه</legend>
      {blocks.map((block, index) => (
        <article
          className="surface"
          key={block.id}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            update(reorder(blocks, drag, index));
            setDrag(-1);
          }}
        >
          <div className="actions">
            <strong
              draggable
              onDragStart={(event) => {
                setDrag(index);
                event.dataTransfer.setData('text/plain', block.id);
              }}
              onDragEnd={() => setDrag(-1)}
            >
              {typeLabels[block.type] || block.type}
            </strong>
            <button
              type="button"
              onClick={() => update(reorder(blocks, index, index - 1))}
              disabled={!index}
            >
              انتقال به بالا
            </button>
            <button
              type="button"
              onClick={() => update(reorder(blocks, index, index + 1))}
              disabled={index === blocks.length - 1}
            >
              انتقال به پایین
            </button>
            <button
              type="button"
              onClick={() =>
                update([
                  ...blocks.slice(0, index + 1),
                  { ...block, id: crypto.randomUUID() },
                  ...blocks.slice(index + 1),
                ])
              }
            >
              تکثیر
            </button>
            <button
              type="button"
              onClick={() =>
                update(blocks.filter((item) => item.id !== block.id))
              }
            >
              حذف
            </button>
            <label>
              <span>
                <input
                  type="checkbox"
                  checked={block.enabled}
                  onChange={(event) =>
                    change(block.id, 'enabled', event.target.checked)
                  }
                />{' '}
                قابل نمایش
              </span>
            </label>
          </div>
          <label>
            عنوان
            <input
              value={block.title || ''}
              onChange={(event) =>
                change(block.id, 'title', event.target.value)
              }
            />
          </label>
          <label>
            متن
            <textarea
              rows="3"
              value={block.body || ''}
              onChange={(event) => change(block.id, 'body', event.target.value)}
            />
          </label>
          <AssetPicker
            label="رسانه"
            value={block.media}
            media={media}
            accept={block.type === 'video' ? 'video/' : 'image/'}
            onChange={(value) => change(block.id, 'media', value)}
          />
          {['statistics', 'features'].includes(block.type) && (
            <>
              {(block.items || []).map((item, itemIndex) => (
                <div className="actions" key={itemIndex}>
                  {['title', 'body'].map((key) => (
                    <label key={key}>
                      {key === 'title' ? 'عنوان' : 'توضیح'}
                      <input
                        value={item[key]}
                        onChange={(event) =>
                          change(
                            block.id,
                            'items',
                            block.items.map((entry, position) =>
                              position === itemIndex
                                ? { ...entry, [key]: event.target.value }
                                : entry,
                            ),
                          )
                        }
                      />
                    </label>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      change(
                        block.id,
                        'items',
                        block.items.filter(
                          (_, position) => position !== itemIndex,
                        ),
                      )
                    }
                  >
                    حذف مورد
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  change(block.id, 'items', [
                    ...(block.items || []),
                    { title: '', body: '' },
                  ])
                }
              >
                افزودن مورد
              </button>
            </>
          )}
        </article>
      ))}
      <div className="actions">
        <select
          aria-label="نوع بخش"
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          {blockTypes.map((item) => (
            <option key={item} value={item}>
              {typeLabels[item] || item}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="button outline"
          onClick={() =>
            update([
              ...blocks,
              { id: crypto.randomUUID(), type, enabled: true },
            ])
          }
        >
          افزودن بخش
        </button>
      </div>
    </fieldset>
  );
}

export function Editor({ entry, type, close }) {
  const [draft, setDraft] = useState(entry?.draft || { title: '' });
  const [slug, setSlug] = useState(entry?.slug || '');
  const [locale, setLocale] = useState(entry?.locale || 'fa-IR');
  const [preview, setPreview] = useState(false);
  const [problem, setProblem] = useState('');
  const cache = useQueryClient();
  const assets = useData('/admin/media');
  const update = (key, value) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const save = useMutation({
    mutationFn: async (payload) => {
      const response = entry
        ? await api.put('/admin/content/' + entry.id, payload)
        : await api.post('/admin/content', payload);
      return response.data;
    },
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: ['/admin/content?type=' + type] });
      close();
    },
    onError: (error) =>
      setProblem(
        error.response?.data?.issues
          ?.map(({ path, message }) => path.join('.') + ' — ' + message)
          .join(', ') ||
          'ذخیره پیش‌نویس انجام نشد. یکتا بودن شناسه را بررسی کنید.',
      ),
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
    const extras = Object.fromEntries(
      Object.keys(lists)
        .filter((key) => values.has(key))
        .map((key) => [
          key,
          values
            .get(key)
            .split(/\r?\n/)
            .map((value) => value.trim())
            .filter(Boolean),
        ]),
    );
    try {
      if (values.has('links'))
        extras.links = values
          .get('links')
          .split(/\r?\n/)
          .filter(Boolean)
          .map((line) => {
            const separator = line.indexOf('|');
            if (separator < 0)
              throw new Error(
                'هر پیوند منو را به‌صورت «عنوان | مسیر» وارد کنید.',
              );
            return {
              label: line.slice(0, separator).trim(),
              target: line.slice(separator + 1).trim(),
            };
          });
      if (values.has('specifications'))
        extras.specifications = JSON.parse(
          values.get('specifications') || '{}',
        );
    } catch (error) {
      setProblem(
        error instanceof SyntaxError
          ? 'مشخصات فنی باید یک شیء JSON معتبر باشد.'
          : error.message,
      );
      return;
    }
    save.mutate({ type, slug, locale, draft: { ...draft, ...extras } });
  }
  return (
    <div className="editor">
      <div className="section-head">
        <h2>{entry ? 'ویرایش پیش‌نویس' : 'مورد جدید'}</h2>
        <button className="button outline" onClick={close}>
          بستن ویرایشگر
        </button>
      </div>
      <form className="form" onSubmit={submit}>
        <div className="surface">
          <label>
            عنوان
            <input
              required
              value={draft.title}
              onChange={(event) => update('title', event.target.value)}
            />
          </label>
          <label>
            شناسه انگلیسی (Slug)
            <input
              dir="ltr"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={slug}
              readOnly={!!entry?.publishedAt}
              onChange={(event) => setSlug(event.target.value)}
            />
          </label>
          <label>
            زبان
            <select
              value={locale}
              disabled={!!entry?.publishedAt}
              onChange={(event) => setLocale(event.target.value)}
            >
              <option value="fa-IR">فارسی</option>
              <option value="en-US">انگلیسی</option>
            </select>
          </label>
          {fields.map((key) => (
            <label key={key}>
              {textFields[key]}
              {key === 'body' || key === 'summary' ? (
                <textarea
                  value={draft[key] || ''}
                  onChange={(event) =>
                    update(key, event.target.value || undefined)
                  }
                />
              ) : (
                <input
                  type={key === 'completedAt' ? 'date' : 'text'}
                  value={draft[key] || ''}
                  onChange={(event) =>
                    update(key, event.target.value || undefined)
                  }
                />
              )}
            </label>
          ))}
          <AssetPicker
            label="تصویر اصلی"
            value={draft.image}
            media={assets.data}
            accept="image/"
            onChange={(value) => update('image', value)}
          />
          {type === 'MENU' && (
            <label>
              پیوندهای منو (در هر سطر: عنوان | مسیر)
              <textarea
                name="links"
                defaultValue={draft.links
                  ?.map(({ label, target }) => label + ' | ' + target)
                  .join('\n')}
              />
            </label>
          )}
          {isProject && (
            <AssetPicker
              label="ویدئو"
              value={draft.video}
              media={assets.data}
              accept="video/"
              onChange={(value) => update('video', value)}
            />
          )}
          {isProduct && (
            <AssetPicker
              label="کاتالوگ PDF"
              value={draft.catalog}
              media={assets.data}
              accept="application/pdf"
              onChange={(value) => update('catalog', value)}
            />
          )}
          {(isProduct || isProject) && (
            <label>
              {lists.gallery}
              <textarea
                name="gallery"
                defaultValue={draft.gallery?.join('\n')}
              />
            </label>
          )}
          {isProduct && (
            <>
              <label>
                {lists.related}
                <textarea
                  name="related"
                  defaultValue={draft.related?.join('\n')}
                />
              </label>
              <label>
                مشخصات فنی (شیء JSON)
                <textarea
                  dir="ltr"
                  name="specifications"
                  rows="4"
                  defaultValue={JSON.stringify(
                    draft.specifications || {},
                    null,
                    2,
                  )}
                />
              </label>
            </>
          )}
        </div>
        {type === 'PAGE' && (
          <Builder
            blocks={draft.blocks || []}
            update={(value) => update('blocks', value)}
            media={assets.data}
          />
        )}
        {problem && <p role="alert">{problem}</p>}
        <div className="actions">
          <button className="button primary" disabled={save.isPending}>
            {save.isPending ? 'در حال ذخیره…' : 'ذخیره پیش‌نویس'}
          </button>
          <button
            type="button"
            className="button outline"
            onClick={() => setPreview(!preview)}
          >
            {preview ? 'بستن پیش‌نمایش' : 'پیش‌نمایش پیش‌نویس'}
          </button>
        </div>
      </form>
      {preview && (
        <section
          className="surface"
          dir={locale === 'fa-IR' ? 'rtl' : 'ltr'}
          lang={locale}
        >
          <h2>{draft.title}</h2>
          <MediaImage src={draft.image} />
          <p className="prose-copy">{draft.summary}</p>
          <p className="prose-copy">{draft.body}</p>
          <Blocks blocks={draft.blocks} locale={locale} />
        </section>
      )}
    </div>
  );
}
