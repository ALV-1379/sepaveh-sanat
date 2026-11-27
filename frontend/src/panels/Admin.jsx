import { useState } from 'react';
import { Link, Route, Routes } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, useData } from '../app/api';
import { Analytics } from '../features/Analytics';
import { Editor } from '../features/Editor';
import { Panel, QueryState } from './Panel';

const sections = {
  PAGE: 'صفحات',
  PRODUCT: 'محصولات',
  PRODUCT_CATEGORY: 'دسته‌بندی محصولات',
  PROJECT: 'پروژه‌ها',
  PROJECT_CATEGORY: 'دسته‌بندی پروژه‌ها',
  ARTICLE: 'اخبار و مقالات',
  CERTIFICATE: 'گواهینامه‌ها',
  TESTIMONIAL: 'دیدگاه مشتریان',
  MENU: 'منوهای ناوبری',
  BANNER: 'بنرها',
  SETTINGS: 'ظاهر سایت',
};
const contentPath = (type) => '/admin/content/' + type;
const links = [
  ['/admin', 'داشبورد'],
  ...Object.entries(sections).map(([type, label]) => [
    contentPath(type),
    label,
  ]),
  ['/admin/media', 'کتابخانه رسانه'],
  ['/admin/inquiries', 'پیام‌ها و درخواست‌ها'],
  ['/admin/analytics', 'آمار بازدید'],
];
function Content({ type }) {
  const [editing, setEditing] = useState(false);
  const path = '/admin/content?type=' + type;
  const query = useData(path);
  const cache = useQueryClient();
  const update = useMutation({
    mutationFn: ({ id, action }) =>
      action === 'publish'
        ? api.post('/admin/content/' + id + '/publish')
        : api.delete('/admin/content/' + id),
    onSuccess: () => cache.invalidateQueries({ queryKey: [path] }),
  });
  return (
    <>
      <h1>{sections[type]}</h1>
      {editing ? (
        <Editor
          entry={editing === true ? undefined : editing}
          type={type}
          close={() => setEditing(false)}
        />
      ) : (
        <>
          <button className="button primary" onClick={() => setEditing(true)}>
            افزودن مورد جدید
          </button>
          {update.isError && <p role="alert">ذخیره تغییرات انجام نشد.</p>}
          <QueryState query={query}>
            {(entries) =>
              entries.length ? (
                <ul className="admin-list">
                  {entries.map((entry) => (
                    <li className="surface" key={entry.id}>
                      <span>
                        <strong>{entry.draft.title}</strong> · {entry.locale} ·{' '}
                        {entry.slug}
                      </span>
                      <span>{entry.publishedAt ? 'منتشرشده' : 'پیش‌نویس'}</span>
                      <button
                        className="button outline"
                        onClick={() => setEditing(entry)}
                      >
                        ویرایش
                      </button>
                      <button
                        className="button primary"
                        disabled={update.isPending}
                        onClick={() =>
                          update.mutate({ id: entry.id, action: 'publish' })
                        }
                      >
                        انتشار پیش‌نویس
                      </button>
                      <button
                        className="button outline"
                        disabled={update.isPending}
                        onClick={() => {
                          if (
                            window.confirm(
                              'این مورد و نسخه منتشرشده آن حذف شود؟',
                            )
                          )
                            update.mutate({ id: entry.id, action: 'delete' });
                        }}
                      >
                        حذف
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>هنوز موردی ثبت نشده است.</p>
              )
            }
          </QueryState>
        </>
      )}
    </>
  );
}
function Media() {
  const path = '/admin/media';
  const query = useData(path);
  const cache = useQueryClient();
  const upload = useMutation({
    mutationFn: (body) => api.post(path, body),
    onSuccess: () => cache.invalidateQueries({ queryKey: [path] }),
  });
  return (
    <>
      <h1>کتابخانه رسانه</h1>
      <form
        className="form surface"
        onSubmit={(event) => {
          event.preventDefault();
          upload.mutate(new FormData(event.currentTarget));
        }}
      >
        <label>
          فایل
          <input
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,application/pdf"
            required
          />
        </label>
        <label>
          <span>
            <input type="checkbox" name="public" value="true" /> نمایش در صفحات
            عمومی
          </span>
        </label>
        <button className="button primary" disabled={upload.isPending}>
          {upload.isPending ? 'در حال بارگذاری…' : 'بارگذاری'}
        </button>
        {upload.isSuccess && <p role="status">فایل با موفقیت بارگذاری شد.</p>}
        {upload.isError && (
          <p role="alert">
            بارگذاری ناموفق بود. فرمت و حجم فایل را بررسی کنید.
          </p>
        )}
      </form>
      <QueryState query={query}>
        {(items) => (
          <ul className="admin-list">
            {items.map(({ id, name, mime, isPublic }) => (
              <li className="surface" key={id}>
                {mime.startsWith('image/') && (
                  <img
                    width="80"
                    loading="lazy"
                    src={'/api/admin/media/' + id + '/thumbnail'}
                    alt=""
                  />
                )}
                <a href={'/api/admin/media/' + id}>{name}</a>
                <small>{isPublic ? 'عمومی' : 'خصوصی'}</small>
                {isPublic && <code dir="ltr">{'/api/public/media/' + id}</code>}
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </>
  );
}
function Inquiries() {
  const path = '/admin/inquiries';
  const query = useData(path);
  const cache = useQueryClient();
  const change = useMutation({
    mutationFn: ({ id, read }) => api.patch(path + '/' + id, { read }),
    onSuccess: () => cache.invalidateQueries({ queryKey: [path] }),
  });
  return (
    <>
      <h1>پیام‌ها و درخواست‌های قیمت</h1>
      {change.isError && <p role="alert">به‌روزرسانی پیام انجام نشد.</p>}
      <QueryState query={query}>
        {(items) =>
          items.length ? (
            <div className="admin-list">
              {items.map(
                ({ id, name, email, message, kind, product, read }) => (
                  <article className="surface" key={id}>
                    <h2>
                      {kind === 'QUOTE' ? 'درخواست قیمت' : 'پیام تماس'} · {name}
                    </h2>
                    <p dir="auto">
                      {email}
                      {product && ' · ' + product}
                    </p>
                    <p className="prose-copy">{message}</p>
                    <button
                      className="button outline"
                      disabled={change.isPending}
                      onClick={() => change.mutate({ id, read: !read })}
                    >
                      {read
                        ? 'نشانه‌گذاری به‌عنوان خوانده‌نشده'
                        : 'نشانه‌گذاری به‌عنوان خوانده‌شده'}
                    </button>
                  </article>
                ),
              )}
            </div>
          ) : (
            <p>هنوز پیامی دریافت نشده است.</p>
          )
        }
      </QueryState>
    </>
  );
}
export function AdminPanel() {
  return (
    <Panel links={links}>
      <Routes>
        <Route
          index
          element={
            <>
              <h1>داشبورد مدیریت محتوا</h1>
              <div className="cards">
                <Link className="surface" to={contentPath('PAGE')}>
                  مدیریت صفحات وب‌سایت
                </Link>
                <Link className="surface" to="/admin/inquiries">
                  بررسی پیام‌ها و درخواست‌ها
                </Link>
                <Link className="surface" to="/admin/analytics">
                  مشاهده آمار وب‌سایت
                </Link>
              </div>
            </>
          }
        />
        {Object.keys(sections).map((type) => (
          <Route
            key={type}
            path={'content/' + type}
            element={<Content key={type} type={type} />}
          />
        ))}
        <Route path="media" element={<Media />} />
        <Route path="inquiries" element={<Inquiries />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="*" element={<p>صفحه موردنظر در پنل مدیریت پیدا نشد.</p>} />
      </Routes>
    </Panel>
  );
}
