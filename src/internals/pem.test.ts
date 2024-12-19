import { describe, expect, test } from "vitest";
import { PrivateKeyCaseNames, PrivateKeyCases } from "./__fixtures__/keys";
import { parsePEM } from "./pem";

describe("pem", () => {
  test.each(PrivateKeyCaseNames)("parsePEM %s", (name) => {
    const key = PrivateKeyCases[name];
    const { type, header, body } = parsePEM(key.pem);
    expect(type).toBe(key.type);
    expect(header).toEqual(key.header);
  });
});
