import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const {
  BROWSER_PATH,
  E2E_EMAIL,
  E2E_PASSWORD,
  E2E_BASE_URL = 'http://localhost:5173',
} = process.env;
assert.ok(
  E2E_EMAIL && E2E_PASSWORD,
  'Supply credentials for a disposable Super Admin account',
);
const browser = await chromium.launch({
  executablePath: BROWSER_PATH || '/usr/bin/chromium',
});
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(E2E_BASE_URL);
  await page.locator('.hero-slide.active h1').waitFor();
  assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
  await page.getByText('EN', { exact: true }).click();
  const englishRadio = page.getByRole('radio', { name: 'EN', exact: true });
  await englishRadio.waitFor({ state: 'attached' });
  assert.equal(await englishRadio.isChecked(), true);
  await page
    .getByRole('heading', { name: /Industrial drying and heating/ })
    .waitFor();
  assert.equal(await page.locator('html').getAttribute('dir'), 'ltr');
  const image = page.locator('.hero-slide.active img');
  await image.evaluate((element) => element.decode());
  assert.ok(await image.evaluate((element) => element.naturalWidth > 0));
  await page.getByRole('button', { name: 'Decline' }).click();
  await page.getByRole('link', { name: 'Explore products' }).click();
  await page.getByRole('link', { name: 'Indirect stone dryer' }).click();
  await page.getByRole('heading', { name: 'Indirect stone dryer' }).waitFor();
  await page
    .getByRole('link', { name: 'Request a quotation', exact: true })
    .click();
  await page.getByLabel('Name').fill('Browser test');
  await page.getByLabel('Phone number').fill('09192414110');
  await page
    .getByLabel('Delivery or installation address')
    .fill('Isfahan, Iran');
  await page.getByRole('radio', { name: 'WhatsApp' }).check();
  await page
    .getByLabel('What products or services do you need?')
    .fill('Quotation form validation from a disposable browser test.');
  await page.getByRole('button', { name: 'Request a quotation' }).click();
  await page.getByText(/Request received/).waitFor();
  await page.goto(E2E_BASE_URL + '/super-admin');
  await page.getByLabel('ایمیل').fill(E2E_EMAIL);
  await page.getByLabel('رمز عبور').fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'ورود', exact: true }).click();
  await page.getByRole('heading', { name: 'نمای کلی سامانه' }).waitFor();
  await page.getByRole('link', { name: 'سلامت سامانه', exact: true }).click();
  await page.getByText('available', { exact: true }).waitFor();
  await page.goto(E2E_BASE_URL + '/admin/content/PAGE');
  await page.getByRole('heading', { name: 'صفحات' }).waitFor();
  await page.getByRole('button', { name: 'افزودن مورد جدید' }).click();
  await page.getByRole('button', { name: 'افزودن بخش', exact: true }).click();
  await page.getByRole('button', { name: 'تکثیر', exact: true }).click();
  assert.equal(
    await page.getByRole('button', { name: 'تکثیر', exact: true }).count(),
    2,
  );
  console.log(
    'Browser smoke passed: localization, navigation, media, quotation, sign-in, health and builder.',
  );
} finally {
  await browser.close();
}
