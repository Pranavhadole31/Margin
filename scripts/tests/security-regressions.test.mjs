import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { validateData } from "../../artifacts/margin/src/lib/storage.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const fromMargin = createRequire(new URL("../../artifacts/margin/package.json", import.meta.url));
const fromSandbox = createRequire(new URL("../../artifacts/mockup-sandbox/package.json", import.meta.url));
const fromVite = createRequire(fromMargin.resolve("vite"));
const fromFastGlob = createRequire(fromSandbox.resolve("fast-glob"));
const fromMicromatch = createRequire(fromFastGlob.resolve("micromatch"));
const picomatch = fromVite("picomatch");

test("all installed dependency paths use patched releases or our patched picomatch", () => {
  const minimums = {
    "body-parser": "2.4.0",
    undici: "7.30.1",
    picomatch: "4.0.7",
    zod: "4.6.6",
    qs: "6.16.1",
    "postcss-selector-parser": "6.1.5",
    "fast-uri": "3.1.9",
  };
  const graph = JSON.parse(execFileSync("pnpm", [
    "list", "-r", ...Object.keys(minimums), "--depth", "Infinity", "--json",
  ], { cwd: root, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }));
  const seen = new Set();
  const atLeast = (version, minimum) => {
    const actual = version.split(".").map(Number);
    const required = minimum.split(".").map(Number);
    for (let i = 0; i < 3; i++) {
      if (actual[i] !== required[i]) return actual[i] > required[i];
    }
    return true;
  };
  function visit(node) {
    for (const group of ["dependencies", "devDependencies", "optionalDependencies"]) {
      for (const [name, dependency] of Object.entries(node[group] ?? {})) {
        if (minimums[name]) {
          // pnpm appends peer/patch metadata after the package version.
          const version = dependency.version.split("(")[0];
          assert(atLeast(version, minimums[name]), `${name}@${version} is vulnerable`);
          seen.add(name);
        }
        visit(dependency);
      }
    }
  }
  graph.forEach(visit);
  assert.deepEqual([...seen].sort(), Object.keys(minimums).sort());
  // A version floor alone cannot prove picomatch is repaired.
  assert.equal(fromVite.resolve("picomatch"), fromMicromatch.resolve("picomatch"));
  for (const pattern of ["+(*)", "+(*a)", "*(*a)", "+(a*)", "+(a*b)", "*(*.js)"]) {
    assert(!/\)[+*]/.test(picomatch.makeRe(pattern).source), `${pattern} nests quantifiers`);
  }
});

test("repeated extglob attack cases finish within a bounded child process", () => {
  const result = spawnSync(process.execPath, ["-e", `
    const assert = require('node:assert/strict');
    const pm = require(process.argv[1]);
    const input = 'a'.repeat(50) + 'b';
    for (const pattern of ['+(*a)', '*(*a)', '+(*a)c', 'x+(*a)']) {
      assert(!pm.isMatch(input, pattern), pattern);
    }
    for (const pattern of [
      '+(*a|z)', '*(*a|z)', '+(z|*a)', 'x+(*a|z)', '+(*a|z)c',
      '+(**a)', '*(**a)', '+(a/*b|z)', '+(a*(*b)|z)'
    ]) {
      for (const options of [{}, { fastpaths: false }, { capture: true }]) {
        assert.throws(() => pm.isMatch(input, pattern, options), {
          name: 'SyntaxError', message: /Unsafe repeated extglob/
        }, pattern);
      }
    }
    assert(pm.isMatch('abc', '+(*)c'));
    assert(pm.isMatch('aaa', '+(*a)'));
    assert(pm.isMatch('a.a', '+(*a)'));
    assert(!pm.isMatch('ab', '+(*a)'));
    assert(pm.isMatch('axbayb', '+(a*b)'));
    assert(!pm.isMatch('axbay', '+(a*b)'));
    assert(pm.isMatch('foo.js', '*(*.js)'));
    assert(!pm.isMatch('foo.ts', '*(*.js)'));
    assert(pm.isMatch('azaz', '+(a|z)'));
    assert(pm.isMatch('azaz', '*(a|z)'));
    assert(pm.isMatch('aaa', '@(*a|z)'));
    assert(pm.isMatch('z', '@(*a|z)'));
    assert(pm.isMatch('*a*', '+([*]|a)'));
    assert(pm.isMatch('*a*', '+(\\\\*|a)'));
  `, fromVite.resolve("picomatch")], { encoding: "utf8", timeout: 2000 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
});

test("legacy micromatch and fast-glob retain the discovery behavior used by Canvas", async (t) => {
  const micromatch = fromFastGlob("micromatch");
  assert.deepEqual(
    micromatch(["a.tsx", "b.ts", "_hidden.tsx", "nested/c.tsx"], ["**/*.tsx", "!**/_*.tsx"]),
    ["a.tsx", "nested/c.tsx"],
  );
  assert.deepEqual(micromatch(["a.js", "b.ts", "c.md"], ["*.{js,ts}"]), ["a.js", "b.ts"]);
  const glob = fromSandbox("fast-glob");
  const fixture = await mkdtemp(path.join(tmpdir(), "margin-glob-"));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  for (const file of ["Card.tsx", "nested/Panel.tsx", "_hidden.tsx", "_draft/Card.tsx", "notes.md"]) {
    const target = path.join(fixture, "src/components/mockups", file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, "");
  }
  const files = await glob("src/components/mockups/**/*.tsx", {
    cwd: fixture,
    ignore: ["**/_*/**", "**/_*.tsx"],
  });
  assert.deepEqual(files.sort(), [
    "src/components/mockups/Card.tsx",
    "src/components/mockups/nested/Panel.tsx",
  ]);
});

test("notebook backup validation remains compatible with Zod 4", () => {
  const empty = { version: 1, sources: [], items: [], results: [] };
  assert.deepEqual(validateData(empty), { ok: true, data: empty });
  assert.equal(validateData({ ...empty, sources: [null] }).ok, false);
  assert.equal(validateData({ ...empty, version: 2 }).ok, false);
  const item = {
    id: "item", title: "Example", body: "Note", kind: "concept", tags: [],
    evidence: [{ sourceId: "source", excerpt: "Evidence" }],
    status: "approved", createdAt: "2026-01-01", demo: false,
  };
  assert.equal(validateData({ ...empty, items: [item] }).ok, false);
  assert.equal(validateData({
    ...empty,
    sources: [{ id: "source", title: "Example", course: "Course", text: "Evidence", createdAt: "2026-01-01", demo: false }],
    items: [item],
  }).ok, true);
});
