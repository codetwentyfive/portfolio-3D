/** Verify the long-form essay's reading flow and references in both languages.
 * BASE_URL=http://127.0.0.1:3105 node scripts/essay-check.mjs
 * SCREENSHOT_DIR=/tmp/portfolio-essay optionally saves visual evidence.
 */
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
const base = process.env.BASE_URL || 'http://127.0.0.1:3105';
const slug = 'faster-than-the-forecast';
const browser = await chromium.launch({channel:'chrome',headless:true});
const shotDir = process.env.SCREENSHOT_DIR;
if (shotDir) await mkdir(shotDir,{recursive:true});
try {
  for (const locale of ['en','de']) {
    const context = await browser.newContext({viewport:{width:1440,height:1000}});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/${locale}/blog`, {waitUntil:'networkidle'});
    await page.locator(`main a[href="/${locale}/blog/${slug}"]`).first().click();
    await page.waitForURL(`**/${locale}/blog/${slug}`);
    await page.locator('.article-body').waitFor();
    const reading = await page.evaluate(() => {
      const article = document.querySelector('article');
      const ids = [...article.querySelectorAll('[id]')].map(n=>n.id);
      return {
        figures: article.querySelectorAll('figure').length,
        sources: article.querySelectorAll('.article-sources > li').length,
        rows: article.querySelectorAll('tbody tr').length,
        columns: article.querySelectorAll('thead th[scope="col"]').length,
        rowHeaders: article.querySelectorAll('tbody th[scope="row"]').length,
        missingTargets: [...article.querySelectorAll('a[href^="#"]')].filter(n=>!document.getElementById(n.hash.slice(1))).map(n=>n.hash),
        duplicateIds: ids.filter((id,i)=>ids.indexOf(id)!==i),
        date: article.querySelector('time').dateTime,
        note: article.querySelector('.article-context').textContent,
        leakedSyntax: /\^\[\d+\]|::: stats/.test(article.innerText),
      };
    });
    assert.equal(reading.figures,3);
    assert.equal(reading.sources,16);
    assert.equal(reading.rows,11);
    assert.equal(reading.columns,3);
    assert.equal(reading.rowHeaders,11);
    assert.deepEqual(reading.missingTargets,[]);
    assert.deepEqual(reading.duplicateIds,[]);
    assert.equal(reading.date,'2026-10-30');
    assert.match(reading.note,/September 2026/);
    assert.equal(reading.leakedSyntax,false);
    for (const img of await page.locator('article img').all()) {
      await img.scrollIntoViewIfNeeded();
      await img.evaluate(img=>img.decode());
      assert.ok(await img.evaluate(img=>img.naturalWidth>0 && !!img.alt));
    }
    for (const width of [1440,390,320]) {
      await page.setViewportSize({width,height:1000});
      await page.evaluate(()=>window.scrollTo(0,0));
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${locale} overflows at ${width}px`);
      const hero = await page.locator('article header img').evaluate(img=>({ratio:img.clientWidth/img.clientHeight,natural:img.naturalWidth/img.naturalHeight}));
      assert.ok(Math.abs(hero.ratio-hero.natural)<0.02,'hero aspect ratio');
      await page.locator('.article-contents summary').click();
      await page.locator('.article-contents a[href="#the-builder"]').click();
      assert.equal(new URL(page.url()).hash,'#the-builder');
      await page.locator('.article-contents summary').click();
      if (width<640) {
        assert.ok(await page.locator('.article-table').evaluate(n=>n.scrollWidth>n.clientWidth),'small-screen table scrolls internally');
        await page.locator('.article-table').evaluate(n=>n.scrollLeft=n.scrollWidth);
        assert.ok(await page.locator('.article-table').evaluate(n=>n.scrollLeft>0));
        await page.locator('.article-table').evaluate(n=>n.scrollLeft=0);
      }
      if (shotDir && width!==320) {
        await page.evaluate(()=>window.scrollTo(0,0));
        await page.screenshot({path:`${shotDir}/${locale}-${width}-top.png`});
        await page.locator('.article-table').screenshot({path:`${shotDir}/${locale}-${width}-table.png`});
        await page.locator('.article-stats').screenshot({path:`${shotDir}/${locale}-${width}-stats.png`});
      }
    }
    await page.locator('#cite-1-1 a').click();
    assert.equal(new URL(page.url()).hash,'#source-1');
    await page.locator('#source-1 a[href="#cite-1-1"]').click();
    assert.equal(new URL(page.url()).hash,'#cite-1-1');
    assert.deepEqual(errors,[],'browser runtime errors');
    console.log(`PASS ${locale}: blog entry, 3 illustrations, 16 sources/backlinks, 11 career rows, contents, accurate dates, 1440/390/320px layouts`);
    await context.close();
  }
} finally { await browser.close(); }
