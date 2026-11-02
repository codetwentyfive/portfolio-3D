// Run against a running dev or production server:
// BASE_URL=http://127.0.0.1:3001 node scripts/world-autoplay-check.mjs
import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.BASE_URL || "http://127.0.0.1:3001";
const browser = await chromium.launch({ headless: true });

async function openScene(path, options = {}) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "no-preference",
    ...options,
  });
  // Observe the real Three group through React's inspection hook, without
  // adding a test API to production or confusing animated water with rotation.
  await page.addInitScript(() => {
    const roots = new Set();
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true,
      renderers: new Map(),
      inject(renderer) {
        const id = this.renderers.size + 1;
        this.renderers.set(id, renderer);
        return id;
      },
      onCommitFiberRoot(id, root) { roots.add(root); },
      onCommitFiberUnmount() {},
      onPostCommitFiberRoot() {},
    };
    window.readWorldYaw = () => {
      const stack = [...roots].map((root) => root.current);
      const seen = new Set();
      while (stack.length) {
        const fiber = stack.pop();
        if (!fiber || seen.has(fiber)) continue;
        seen.add(fiber);
        const object = fiber.stateNode?.object || fiber.stateNode;
        if (object?.isObject3D && object.name === "project-world")
          return object.rotation.y;
        if (fiber.child) stack.push(fiber.child);
        if (fiber.sibling) stack.push(fiber.sibling);
      }
      return null;
    };
  });
  await page.goto(new URL(path, base).href, { waitUntil: "networkidle" });
  return page;
}

async function ready(page) {
  await page.waitForSelector('.world-enhancement[data-ready="true"]');
  await page.waitForFunction(() => window.readWorldYaw() !== null);
  await page.waitForTimeout(300);
}

async function assertRotation(page, rotating, label) {
  const before = await page.evaluate(() => window.readWorldYaw());
  await page.waitForTimeout(1500);
  const after = await page.evaluate(() => window.readWorldYaw());
  const delta = Math.abs(Math.atan2(Math.sin(after - before), Math.cos(after - before)));
  assert.ok(rotating ? delta > 0.005 : delta < 0.00001,
    `${label}: expected ${rotating ? "rotation" : "stillness"}, measured ${delta} radians`);
  console.log(`PASS ${label} (${delta.toFixed(4)} radians)`);
}

try {
  for (const [label, path, options] of [
    ["default desktop", "/en", {}],
    ["default mobile", "/en", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
    ["shop direct entry", "/en?world=shop", {}],
    ["Potera direct entry", "/en?world=potera", {}],
  ]) {
    const page = await openScene(path, options);
    await ready(page);
    await assertRotation(page, true, `${label} rotates without input`);
    if (label === "default desktop") {
      await page.getByRole("button", { name: "Scene options", exact: true }).click();
      await page.getByRole("button", { name: "Pause animation", exact: true }).click();
      await page.getByRole("button", { name: "Close scene options", exact: true }).click();
      await assertRotation(page, false, "explicit pause");
      await page.getByRole("button", { name: "Scene options", exact: true }).click();
      await page.getByRole("button", { name: "Resume animation", exact: true }).click();
      await page.getByRole("button", { name: "Close scene options", exact: true }).click();
      await assertRotation(page, true, "resume");
    }
    await page.close();
  }
  const reduced = await openScene("/en", { reducedMotion: "reduce" });
  assert.equal(await reduced.locator("canvas").count(), 0, "reduced motion starts with the poster");
  await reduced.getByRole("button", { name: "View interactive scene", exact: true }).click();
  await ready(reduced);
  await assertRotation(reduced, false, "reduced motion stays still after enabling 3D");
  await reduced.close();
} finally {
  await browser.close();
}
