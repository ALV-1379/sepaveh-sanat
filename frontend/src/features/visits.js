import { api } from '../app/api';

const queued = [];
let timeout;
export function trackVisit(path) {
  if (localStorage.getItem('analytics-consent') !== 'yes' || navigator.globalPrivacyControl || navigator.doNotTrack === '1') return;
  let visitor = localStorage.getItem('visitor-id');
  if (!visitor) {
    visitor = crypto.randomUUID();
    localStorage.setItem('visitor-id', visitor);
  }
  const referrer = document.referrer ? new URL(document.referrer).hostname : undefined;
  queued.push({ path, referrer: referrer === location.hostname ? undefined : referrer });
  if (timeout) return;
  timeout = window.setTimeout(() => {
    timeout = undefined;
    api.post('/public/visits', { visitor, events: queued.splice(0, 20) }).catch(() => {});
  }, 1000);
}
