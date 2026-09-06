import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

function policyFor(mode) {
  // Each process loads the real config with a fresh environment/module cache.
  const env = { ...process.env };
  if (mode === undefined) delete env.NODE_ENV;
  else env.NODE_ENV = mode;
  const output = execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      'import config from "./next.config.mjs"; console.log(JSON.stringify(await config.headers()));',
    ],
    { cwd: root, env, encoding: "utf8" },
  );
  const routes = JSON.parse(output);
  return routes
    .find((route) => route.source === "/(.*)")
    .headers.find((header) => header.key === "Content-Security-Policy").value;
}

test("development allows Next.js eval but does not upgrade local HTTP", () => {
  const policy = policyFor("development");
  assert.match(policy, /script-src[^;]*'unsafe-eval'/);
  assert.doesNotMatch(policy, /upgrade-insecure-requests/);
});

test("production keeps JavaScript eval blocked and HTTPS upgrading enabled", () => {
  const policy = policyFor("production");
  assert.doesNotMatch(policy, /'unsafe-eval'/);
  assert.match(policy, /'wasm-unsafe-eval'/);
  assert.match(policy, /upgrade-insecure-requests/);
  assert.match(policy, /object-src 'none'/);
  assert.match(policy, /frame-ancestors 'none'/);
});

test("only explicit development mode receives the exceptions", () => {
  const production = policyFor("production");
  for (const mode of ["test", undefined]) {
    assert.equal(policyFor(mode), production);
  }
  assert.equal(
    policyFor("development").replace("'unsafe-eval' ", "") +
      "; upgrade-insecure-requests",
    production,
    "all other CSP protections must remain identical",
  );
});
