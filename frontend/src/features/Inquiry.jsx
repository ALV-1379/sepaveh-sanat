import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { api } from '../app/api';
import { quoteChannels } from './quoteChannels';

const schema = z.object({
  name: z.string().trim().min(2).max(240),
  email: z.email().max(254),
  message: z.string().trim().min(10).max(8000),
});
const quoteSchema = schema.omit({ email: true }).extend({
  address: z.string().trim().min(5).max(500),
  phone: z
    .string()
    .trim()
    .max(32)
    .refine((value) =>
      /^\+?[0-9۰-۹٠-٩]{7,15}$/.test(value.replace(/[\s()-]/g, '')),
    ),
  channel: z.enum(Object.keys(quoteChannels)),
});

export function Inquiry({ quote, fa, product }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(quote ? quoteSchema : schema) });
  const submit = useMutation({
    mutationFn: (values) =>
      api.post('/public/inquiries', {
        ...values,
        kind: quote ? 'QUOTE' : 'CONTACT',
        product: product || undefined,
      }),
    onSuccess: () => reset(),
  });
  return (
    <form
      className={quote ? 'form surface quote-form' : 'form surface'}
      onSubmit={handleSubmit((values) => submit.mutate(values))}
    >
      {quote && (
        <p>
          {fa
            ? 'اطلاعات زیر را وارد کنید تا تیم فروش از راه انتخابی شما پیگیری کند.'
            : 'Tell us what you need and how our sales team should follow up.'}
        </p>
      )}
      <label>
        {fa ? 'نام' : 'Name'}
        <input autoComplete="name" {...register('name')} required />
      </label>
      {!quote && (
        <label>
          {fa ? 'ایمیل' : 'Email'}
          <input
            dir="ltr"
            type="email"
            autoComplete="email"
            {...register('email')}
            required
          />
        </label>
      )}
      {quote && (
        <>
          <label>
            {fa ? 'شماره تلفن' : 'Phone number'}
            <input
              dir="ltr"
              type="tel"
              autoComplete="tel"
              maxLength={32}
              required
              aria-invalid={!!errors.phone}
              {...register('phone')}
            />
            {errors.phone && (
              <span role="alert">
                {fa
                  ? 'شماره معتبر با ۷ تا ۱۵ رقم وارد کنید.'
                  : 'Enter a valid phone number with 7 to 15 digits.'}
              </span>
            )}
          </label>
          <label>
            {fa ? 'آدرس محل تحویل یا اجرا' : 'Delivery or installation address'}
            <textarea
              autoComplete="street-address"
              rows={2}
              minLength={5}
              maxLength={500}
              required
              {...register('address')}
            />
          </label>
          <fieldset className="quote-channels">
            <legend>
              {fa
                ? 'روش دریافت پیش‌فاکتور'
                : 'Preferred quotation contact method'}
            </legend>
            {Object.entries(quoteChannels).map(([value, labels]) => (
              <label key={value}>
                <input
                  type="radio"
                  value={value}
                  required
                  {...register('channel')}
                />
                {labels[fa ? 0 : 1]}
              </label>
            ))}
          </fieldset>
        </>
      )}
      <label>
        {quote
          ? fa
            ? 'چه محصول یا خدماتی نیاز دارید؟'
            : 'What products or services do you need?'
          : fa
            ? 'پیام'
            : 'Message'}
        <textarea
          rows="5"
          minLength={10}
          maxLength={8000}
          placeholder={
            quote
              ? fa
                ? 'مثلاً نوع دستگاه، ظرفیت موردنیاز یا ابعاد سنگ'
                : 'For example, equipment type, required capacity, or stone dimensions'
              : undefined
          }
          {...register('message')}
          required
        />
      </label>
      {!!Object.keys(errors).length && (
        <p role="alert">
          {fa
            ? 'لطفاً اطلاعات فرم را بررسی کنید.'
            : 'Check the highlighted details and enter at least 10 characters in your request.'}
        </p>
      )}
      {submit.isSuccess && (
        <p role="status">
          {quote
            ? fa
              ? 'درخواست شما ثبت شد. تیم فروش از راه انتخابی شما پیگیری می‌کند.'
              : 'Request received. Our sales team will follow up using your selected method.'
            : fa
              ? 'پیام ارسال شد.'
              : 'Your message was sent.'}
        </p>
      )}
      {submit.isError && (
        <p role="alert">
          {fa
            ? 'ارسال ناموفق بود.'
            : 'Could not send your message. Please try again.'}
        </p>
      )}
      <button className="button primary" disabled={submit.isPending}>
        {submit.isPending
          ? fa
            ? 'در حال ارسال…'
            : 'Sending…'
          : quote
            ? fa
              ? 'ثبت درخواست پیش‌فاکتور'
              : 'Request a quotation'
            : fa
              ? 'ارسال'
              : 'Send message'}
      </button>
    </form>
  );
}
