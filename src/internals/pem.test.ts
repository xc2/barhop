import { describe, test } from "vitest";
import { keys } from "./__fixtures__/keys";
import { parsePEM } from "./pem";

describe("pem", () => {
  test.each(keys)("parsePEM %s", (key) => {
    const { type, header, body } = parsePEM(key.pem);
    console.log({ type, header, body });
  });
});
