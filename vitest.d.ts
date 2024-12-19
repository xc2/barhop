declare module "vitest" {
  import vr = require("@vitest/runner");
  import ve = require("@vitest/expect");
  const suite: typeof vr.suite;
  const test: typeof vr.test;
  const describe: typeof vr.describe;
  const it: typeof vr.it;
  const beforeAll: typeof vr.beforeAll;
  const afterAll: typeof vr.afterAll;
  const beforeEach: typeof vr.beforeEach;
  const afterEach: typeof vr.afterEach;
  const onTestFailed: typeof vr.onTestFailed;
  const onTestFinished: typeof vr.onTestFinished;

  const expect: ve.ExpectStatic;
}
