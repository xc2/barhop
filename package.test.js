import * as assert from "node:assert/strict";
/**
 * To test against the packaged code to ensure the end project can import/require the package correctly.
 */
import { createRequire } from "node:module";
import { resolve as resolvePath } from "node:path";
import { describe, test } from "node:test";
const require = createRequire(import.meta.url);

describe("package", () => {
  test("esm", async () => {
    const m = await import("barhop/sign.js");
    assert.equal(typeof m.sign, "function");
  });
  test("cjs", () => {
    assert.equal(require.resolve("barhop/sign.js"), resolvePath("./dist/cjs/sign.cjs"));
    assert.equal(typeof require("barhop/sign.js").sign, "function");
  });
});
