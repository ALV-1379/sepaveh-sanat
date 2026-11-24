import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const { BROWSER_PATH, E2E_EMAIL, E2E_PASSWORD, E2E_BASE_URL = 'http://localhost:5173' } = process.env;
assert.ok(E2E_EMAIL && E2E_PASSWORD, 'Supply credentials for a disposable Super Admin account');
const browser = await chromium.launch({ executablePath: BROWSER_PATH || '/usr/bin/chromium' });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(E2E_BASE_URL);
  await page.locator('.hero h1').waitFor();
  assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
  await page.getByRole('link', { name: 'EN', exact: true }).click();
  await page.getByRole('heading', { name: /Industrial solutions/ }).waitFor();
  assert.equal(await page.locator('html').getAttribute('dir'), 'ltr');
  const image = page.locator('.hero img');
  await image.evaluate((element) => element.decode());
  assert.ok(await image.evaluate((element) => element.naturalWidth > 0));
  await page.getByRole('button', { name: 'Decline' }).click();
  await page.getByRole('link', { name: 'Explore products' }).click();
  await page.getByRole('link', { name: 'Steel structures' }).click();
  await page.getByRole('heading', { name: 'Steel structures' }).waitFor();
  await page.getByRole('link', { name: 'Request a quotation', exact: true }).click();
  await page.getByLabel('Name').fill('Browser test');
  await page.getByLabel('Email').fill('browser-test@example.com');
  await page.getByLabel('Message').fill('Quotation form validation from a disposable browser test.');
  await page.getByRole('button', { name: 'Send message' }).click();
  await page.getByText('Your message was sent.').waitFor();
  await page.goto(E2E_BASE_URL + '/super-admin');
  await page.getByLabel('Email').fill(E2E_EMAIL);
  await page.getByLabel('Password').fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('heading', { name: 'System overview' }).waitFor();
  await page.getByRole('link', { name: 'System health', exact: true }).click();
  await page.getByText('available', { exact: true }).waitFor();
  await page.goto(E2E_BASE_URL + '/admin/content/PAGE');
  await page.getByRole('heading', { name: 'Pages' }).waitFor();
  await page.getByRole('button', { name: 'New entry' }).click();
  await page.getByRole('button', { name: 'Add section', exact: true }).click();
  await page.getByRole('button', { name: 'Duplicate', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'Duplicate', exact: true }).count(), 2);
  console.log('Browser smoke passed: localization, navigation, media, quotation, sign-in, health and builder.');
} finally {
  await browser.close();
}
