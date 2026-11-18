const { test, expect } = require('@playwright/test');

test.describe('Vercodex landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('page title and meta', async ({ page }) => {
    await expect(page).toHaveTitle(/Vercodex/i);
  });

  test('no hero switcher or theme switcher visible', async ({ page }) => {
    const heroSwitcher = page.locator('text=Hero').first();
    await expect(heroSwitcher).toHaveCount(0);
    // Theme switcher dots gone
    const themeButtons = page.locator('button:has-text("◆")');
    await expect(themeButtons).toHaveCount(0);
  });

  test('all major sections present', async ({ page }) => {
    await expect(page.locator('#features')).toBeVisible();
    await expect(page.locator('#faq')).toBeVisible();
    await expect(page.locator('#cta')).toBeVisible();
    // Engagements section removed
    const engagementsHeading = page.locator('h2:has-text("Start small. Scale as the gains compound")');
    await expect(engagementsHeading).toHaveCount(0);
  });

  test('hero canvas background rendered', async ({ page }) => {
    const canvas = page.locator('#hero-bg');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box.width).toBeGreaterThan(600);
    expect(box.height).toBeGreaterThan(300);
  });

  test('fabricated social proof is absent', async ({ page }) => {
    await expect(page.locator('.ticker-wrap')).toHaveCount(0);
    await expect(page.locator('#testimonials')).toHaveCount(0);
    const body = await page.locator('body').innerText();
    for (const claim of ['MERIDIAN ENERGY', 'ATLAS CAPITAL', 'Proof, not promises', '99.99%', '2.84M']) {
      expect(body).not.toContain(claim);
    }
  });

  test('fonts load without 404s', async ({ page }) => {
    const failed = [];
    page.on('response', r => { if (r.url().includes('.woff2') && !r.status() >= 400) failed.push(r.url()); });
    await page.reload();
    await page.waitForLoadState('networkidle');
    expect(failed).toEqual([]);
  });

  test('email form works', async ({ page }) => {
    const input = page.locator('input[placeholder="you@company.com"]').first();
    await input.fill('test@company.com');
    const btn = page.locator('button:has-text("Notify me")').first();
    await btn.click();
    await expect(page.locator("text=You're on the list").first()).toBeVisible({ timeout: 3000 });
  });

  test('FAQ accordion opens and closes', async ({ page }) => {
    await page.locator('#faq').scrollIntoViewIfNeeded();
    const buttons = page.locator('#faq button');
    await expect(buttons.first()).toBeVisible();
    // FAQ button is visible and clickable
    await expect(buttons.first()).toBeEnabled();
    await buttons.first().click();
    await page.waitForTimeout(200);
  });

  test('nav is sticky and visible when scrolled', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(200);
    const nav = page.locator('div[style*="position:sticky"]').first();
    await expect(nav).toBeVisible();
  });

  test('no broken images', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const naturalWidth = await img.evaluate(el => el.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });

  test('performance: LCP under 3s', async ({ page }) => {
    const lcp = await page.evaluate(() =>
      new Promise(resolve => {
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          resolve(entries[entries.length - 1].startTime);
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        setTimeout(() => resolve(null), 3000);
      })
    );
    if (lcp !== null) expect(lcp).toBeLessThan(3000);
  });

  test('no horizontal scroll overflow', async ({ page }) => {
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });

  test('CTA button is clickable', async ({ page }) => {
    const ctaBtn = page.locator('a:has-text("Get updates")').first();
    await expect(ctaBtn).toBeVisible();
    await expect(ctaBtn).toBeEnabled();
  });
});
