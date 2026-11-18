import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function scenario(page: Page, label: string) {
  await page.getByText('Explore demo scenarios', { exact: true }).click();
  await page.getByRole('button', { name: label, exact: true }).click();
  await expect(page.locator('.answer-card')).toBeVisible();
}

async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('landing page has four usable examples and passes accessibility checks', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /Good questions/ })).toBeVisible();
  await expect(page.locator('.example-card')).toHaveCount(4);
  await expect(page.getByRole('button', { name: 'Ask question' })).toBeDisabled();
  await expectNoOverflow(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('confident answer reveals exact citations, pagination, and context', async ({ page }) => {
  await page.getByRole('button', { name: /Time off What is our annual leave policy/ }).click();
  await expect(page.locator('.confidence-badge')).toHaveText('94% confidence');
  await expect(page.locator('.answer-body')).toContainText('25 days');
  await expect(page.locator('.source-card')).toHaveCount(3);
  await expect(page.locator('.enrichment')).toHaveCount(0);
  const source = page.getByRole('button', { name: 'Open source 1: People handbook' });
  await source.click();
  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole('heading', { name: 'People handbook', exact: true })).toBeVisible();
  await expect(drawer.locator('blockquote')).toHaveText('Full-time employees receive 25 days of paid annual leave per calendar year, in addition to local public holidays. Leave is prorated for employees joining partway through the year.');
  await expect(drawer.locator('mark')).toHaveText(await drawer.locator('blockquote').innerText());
  await expect(drawer.getByRole('button', { name: 'Previous source' })).toBeDisabled();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await drawer.getByRole('button', { name: 'Next source' }).click();
  await expect(drawer.getByRole('heading', { name: 'Booking time off', exact: true })).toBeVisible();
  await drawer.getByRole('button', { name: 'Close source' }).click();
  await expect(drawer).toHaveCount(0);
  await expect(source).toBeFocused();
  await expectNoOverflow(page);
});

test('low confidence is visibly incomplete and enrichment is an honest local action', async ({ page }) => {
  await page.getByRole('button', { name: /Remote work Can I work from another country/ }).click();
  await expect(page.locator('.confidence-low')).toHaveText('42% confidence');
  await expect(page.getByText('This answer is incomplete', { exact: true })).toBeVisible();
  await expect(page.locator('.answer-body')).toContainText('do not establish');
  await page.getByRole('button', { name: 'Request international remote-work policy' }).click();
  await expect(page.getByRole('button', { name: 'Added to demo checklist' })).toBeDisabled();
  await expect(page.getByText(/no request was sent and no files were uploaded/)).toBeVisible();
  await expectNoOverflow(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('missing information has a dedicated state and no invented confidence', async ({ page }) => {
  await page.getByRole('button', { name: /Benefits What is our parental leave policy/ }).click();
  await expect(page.getByRole('heading', { name: 'We don’t have enough information yet' })).toBeVisible();
  await expect(page.locator('.confidence-badge')).toHaveText('Confidence not supplied');
  await expect(page.getByText(/No sources supplied/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Request parental leave policy' })).toBeVisible();
  await expectNoOverflow(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('irrelevant retrieved documents are inspectable without claiming support', async ({ page }) => {
  await page.getByRole('button', { name: /Travel What is our travel allowance/ }).click();
  await expect(page.getByText(/This source does not answer your question/)).toBeVisible();
  await expect(page.locator('.answer-body')).toHaveCount(0);
  await expect(page.locator('.sources-disclaimer')).toBeVisible();
  await page.getByRole('button', { name: 'Open source 1: Team offsite notes' }).click();
  await expect(page.getByRole('dialog').locator('blockquote')).toContainText('do not define an employee travel');
  await expectNoOverflow(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('absent citations do not imply a verified answer', async ({ page }) => {
  await scenario(page, 'No citations');
  await expect(page.locator('.answer-body')).toBeVisible();
  await expect(page.getByText(/This answer cannot be verified against a source here/)).toBeVisible();
  await expect(page.locator('.enrichment')).toHaveCount(0);
  await expectNoOverflow(page);
});

test('unavailable documents preserve the exact excerpt', async ({ page }) => {
  await scenario(page, 'Unavailable source');
  await page.getByRole('button', { name: 'Open source 1: Unavailable document' }).click();
  await expect(page.getByRole('heading', { name: 'Document not available' })).toBeVisible();
  await expect(page.getByRole('dialog').locator('blockquote')).toContainText('25 days');
  await expect(page.locator('.document-body')).toHaveCount(0);
  await expectNoOverflow(page);
});

test('invalid offsets show the source without a misleading highlight', async ({ page }) => {
  await scenario(page, 'Invalid source offset');
  await page.getByRole('button', { name: 'Open source 1: People handbook' }).click();
  await expect(page.getByText(/could not be located at the supplied offset/)).toBeVisible();
  await expect(page.getByRole('dialog').locator('blockquote')).toContainText('25 days');
  await expect(page.locator('.document-body')).toBeVisible();
  await expect(page.locator('mark')).toHaveCount(0);
  await expectNoOverflow(page);
});

test('empty excerpts do not produce empty quotes or highlights', async ({ page }) => {
  await scenario(page, 'Empty source snippet');
  await page.getByRole('button', { name: 'Open source 1: People handbook' }).click();
  await expect(page.getByText('No excerpt was supplied with this citation.')).toBeVisible();
  await expect(page.locator('mark')).toHaveCount(0);
  await expectNoOverflow(page);
});

test('zero confidence is displayed as zero', async ({ page }) => {
  await scenario(page, 'Zero confidence');
  await expect(page.locator('.confidence-low')).toHaveText('0% confidence');
  await expect(page.getByText('This answer is incomplete', { exact: true })).toBeVisible();
  await expectNoOverflow(page);
});

test('unknown confidence is not replaced with an invented score', async ({ page }) => {
  await scenario(page, 'Unknown confidence');
  await expect(page.locator('.confidence-badge')).toHaveText('Confidence not supplied');
  await page.locator('.confidence-badge').click();
  await expect(page.getByText(/not a verified probability/)).toBeVisible();
  await expectNoOverflow(page);
});

test('high confidence does not hide missing information', async ({ page }) => {
  await scenario(page, 'High confidence, missing info');
  await expect(page.locator('.confidence-high')).toHaveText('94% confidence');
  await expect(page.getByText('This answer is incomplete', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Request local leave addendum' })).toBeVisible();
  await expectNoOverflow(page);
});

test('absent optional fields render safely', async ({ page }) => {
  await scenario(page, 'Absent optional fields');
  await expect(page.locator('.answer-body')).toContainText('optional metadata omitted');
  await expect(page.locator('.confidence-badge')).toHaveText('Confidence not supplied');
  await expect(page.getByText(/No sources supplied/)).toBeVisible();
  await expectNoOverflow(page);
});

for (const failure of ['Service error', 'Invalid response']) {
  test(`${failure} has a working retry`, async ({ page }) => {
    await page.getByText('Explore demo scenarios', { exact: true }).click();
    await page.getByRole('button', { name: failure, exact: true }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expectNoOverflow(page);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.locator('.answer-body')).toContainText('25 days');
  });
}

test('a newer question wins over an older slow request', async ({ page }) => {
  await page.getByText('Explore demo scenarios', { exact: true }).click();
  await page.getByRole('button', { name: 'Slow request', exact: true }).click();
  await expect(page.getByRole('status', { name: '' }).filter({ hasText: 'Loading your answer' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Your question' }).fill('What is our parental leave policy?');
  await page.getByRole('button', { name: 'Ask question' }).click();
  await expect(page.getByRole('heading', { name: 'We don’t have enough information yet' })).toBeVisible();
  await page.waitForTimeout(5100);
  await expect(page.getByRole('heading', { name: 'We don’t have enough information yet' })).toBeVisible();
  await expect(page.locator('.submitted-question')).toHaveText('What is our parental leave policy?');
  await expect(page.locator('.answer-body')).toHaveCount(0);
});

test('cancelling a request returns to the examples', async ({ page }) => {
  await page.getByText('Explore demo scenarios', { exact: true }).click();
  await page.getByRole('button', { name: 'Slow request', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel request' }).click();
  await expect(page.locator('.example-card')).toHaveCount(4);
  await expect(page.locator('.result-region')).toHaveCount(0);
});

test('keyboard submission, multiline input, modal isolation, and Escape work', async ({ page }) => {
  test.skip(test.info().project.name === 'safari' || test.info().project.name === 'mobile', 'Physical keyboard checks run on desktop and tablet.');
  const question = page.getByRole('textbox', { name: 'Your question' });
  await question.fill('Annual leave');
  await question.press('Shift+Enter');
  await expect(question).toHaveValue('Annual leave\n');
  await question.press('Enter');
  await expect(page.locator('.answer-card')).toBeVisible();
  await page.getByRole('button', { name: 'Open source 1: People handbook' }).click();
  const close = page.getByRole('button', { name: 'Close source' });
  await expect(close).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('region', { name: 'People handbook' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Next source' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('region', { name: 'People handbook' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(close).toBeFocused();
  await question.focus();
  await expect(close).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Booking time off' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('long unbroken questions wrap and input is bounded', async ({ page }) => {
  const question = page.getByRole('textbox', { name: 'Your question' });
  await question.fill('a'.repeat(1000));
  await expect(question).toHaveAttribute('maxlength', '1000');
  await expect(page.getByText('1000 / 1,000 characters', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ask question' }).click();
  await expect(page.locator('.answer-card')).toBeVisible();
  await expectNoOverflow(page);
});

test('whitespace is not submitted and query markup is rendered as text', async ({ page }) => {
  const question = page.getByRole('textbox', { name: 'Your question' });
  await question.fill('   ');
  await expect(page.getByRole('button', { name: 'Ask question' })).toBeDisabled();
  await question.fill('<img src=x onerror=alert(1)>');
  await page.getByRole('button', { name: 'Ask question' }).click();
  await expect(page.locator('.submitted-question')).toHaveText('<img src=x onerror=alert(1)>');
  await expect(page.locator('main img')).toHaveCount(0);
  await expect(page.locator('.answer-card')).toBeVisible();
});

test('every demo scenario renders without browser errors or outbound requests', async ({ page }) => {
  const errors: string[] = [];
  const outbound: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', (request) => { if (!request.url().startsWith('http://127.0.0.1:4173')) outbound.push(request.url()); });
  for (const label of ['Time off', 'Remote work', 'Benefits', 'Travel', 'No citations', 'Unavailable source', 'Invalid source offset', 'Empty source snippet', 'Zero confidence', 'Unknown confidence', 'High confidence, missing info', 'Absent optional fields']) {
    await scenario(page, label);
    await expectNoOverflow(page);
  }
  expect(errors).toEqual([]);
  expect(outbound).toEqual([]);
});

test('smallest supported phone and wide desktop stay within the viewport', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop', 'Additional width checks use one browser project.');
  for (const width of [320, 360, 520, 1024, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expectNoOverflow(page);
    await page.getByRole('button', { name: /Time off What is our annual leave policy/ }).click();
    await expect(page.locator('.answer-card')).toBeVisible();
    await expectNoOverflow(page);
    await page.locator('.confidence-badge').click();
    await expectNoOverflow(page);
    await page.getByRole('button', { name: 'Open source 1: People handbook' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expectNoOverflow(page);
  }
});
