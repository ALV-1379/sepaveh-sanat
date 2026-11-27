import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { api } from '../app/api';

const schema = z.object({
  name: z.string().trim().min(2).max(240),
  email: z.email().max(254),
  message: z.string().trim().min(10).max(8000),
});

export function Inquiry({ quote, fa, product }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });
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
      className="form surface"
      onSubmit={handleSubmit((values) => submit.mutate(values))}
    >
      <label>
        {fa ? 'نام' : 'Name'}
        <input autoComplete="name" {...register('name')} required />
      </label>
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
      <label>
        {fa ? 'پیام' : 'Message'}
        <textarea rows="5" {...register('message')} required />
      </label>
      {!!Object.keys(errors).length && (
        <p role="alert">
          {fa
            ? 'لطفاً اطلاعات فرم را بررسی کنید.'
            : 'Check your name, email and message (at least 10 characters).'}
        </p>
      )}
      {submit.isSuccess && (
        <p role="status">{fa ? 'پیام ارسال شد.' : 'Your message was sent.'}</p>
      )}
      {submit.isError && (
        <p role="alert">
          {fa
            ? 'ارسال ناموفق بود.'
            : 'Could not send your message. Please try again.'}
        </p>
      )}
      <button className="button primary" disabled={submit.isPending}>
        {fa ? 'ارسال' : 'Send message'}
      </button>
    </form>
  );
}
