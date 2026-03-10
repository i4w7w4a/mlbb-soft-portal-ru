import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import { resolveContentRoot } from "@/lib/content/paths";

test("resolveContentRoot falls back to the repo content directory", () => {
  assert.equal(resolveContentRoot(undefined), path.join(process.cwd(), "content"));
});

test("resolveContentRoot preserves absolute content roots", () => {
  const absoluteRoot = path.join(process.cwd(), ".tmp", "content-store");

  assert.equal(resolveContentRoot(absoluteRoot), absoluteRoot);
});

test("resolveContentRoot expands relative content roots against the repo root", () => {
  assert.equal(
    resolveContentRoot("./var/content-store"),
    path.resolve(process.cwd(), "./var/content-store"),
  );
});
