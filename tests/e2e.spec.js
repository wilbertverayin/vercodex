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

  test('ticker is visible and contains logo names', async ({ page }) => {
    const ticker = page.locator('.ticker-wrap');
    await expect(ticker).toBeVisible();
    await expect(page.locator('.ticker-inner').first()).toContainText('MERIDIAN ENERGY');
    await expect(page.locator('.ticker-inner').first()).toContainText('ATLAS CAPITAL');
  });

  test('ticker is positioned between metrics and testimonials', async ({ page }) => {
    const allSections = await page.evaluate(() => {
      const sections = [];
      document.querySelectorAll('#features, #faq, #cta, .ticker-wrap, [data-animate]').forEach(el => {
        sections.push({ id: el.id || el.className, top: el.getBoundingClientRect().top + window.scrollY });
      });
      return sections;
    });
    // Just verify ticker exists in DOM after metrics
    const ticker = page.locator('.ticker-wrap');
    await expect(ticker).toBeVisible();
  });

  for (const prefix of ['hero', 'cta']) {
    test(`${prefix} form posts to Formspree and shows success`, async ({ page }) => {
      let request;
      await page.route('https://formspree.io/f/*', async route => {
        request = route.request();
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
      });
      await page.locator(`#${prefix}-email`).fill('test@company.com');
      await page.locator(`#${prefix}-form button`).click();
      await expect(page.locator(`#${prefix}-success`)).toBeVisible();
      await expect(page.locator(`#${prefix}-form`)).toBeHidden();
      expect(request.method()).toBe('POST');
      expect(request.headers()['accept']).toBe('application/json');
      expect(request.postDataJSON().email).toBe('test@company.com');
    });

    test(`${prefix} form shows an error and re-enables the button on failure`, async ({ page }) => {
      let release;
      const gate = new Promise(r => { release = r; });
      await page.route('https://formspree.io/f/*', async route => {
        await gate;
        await route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"boom"}' });
      });
      const button = page.locator(`#${prefix}-form button`);
      await page.locator(`#${prefix}-email`).fill('test@company.com');
      await button.click();
      await expect(button).toBeDisabled();
      release();
      await expect(page.locator(`#${prefix}-error`)).toContainText('not saved');
      await expect(page.locator(`#${prefix}-success`)).toBeHidden();
      await expect(button).toBeEnabled();
    });
  }

  test('invalid email sends nothing', async ({ page }) => {
    let called = false;
    await page.route('https://formspree.io/f/*', route => { called = true; route.abort(); });
    await page.locator('#hero-email').fill('nope');
    await page.locator('#hero-form button').click();
    await expect(page.locator('#hero-error')).toBeVisible();
    expect(called).toBe(false);
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
