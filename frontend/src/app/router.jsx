import { createBrowserRouter } from 'react-router';

const publicPage = async () => ({
  Component: (await import('../panels/Public')).PublicSite,
});
const adminPanel = async () => ({
  Component: (await import('../panels/Admin')).AdminPanel,
});
const superPanel = async () => ({
  Component: (await import('../panels/Super')).SuperPanel,
});

export const router = createBrowserRouter([
  { path: '/admin/*', lazy: adminPanel },
  { path: '/super-admin/*', lazy: superPanel },
  { path: '/en/*', lazy: publicPage },
  { path: '/*', lazy: publicPage },
]);
