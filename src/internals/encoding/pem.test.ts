import { PrivateKeyCaseNames, PrivateKeyCases } from "src/__fixtures__/keys";
import { describe, expect, test } from "vitest";
import { parsePEM } from "./pem";

describe("pem", () => {
  test.each(PrivateKeyCaseNames)("parsePEM %s", (name) => {
    const key = PrivateKeyCases[name];
    const { type, header, body } = parsePEM(key.pem);
    expect(type).toBe(key.type);
    expect(header).toEqual(key.header);
    if (key.der.byteLength && type !== "ENCRYPTED PRIVATE KEY") {
      expect(body).toEqual(key.der);
    }
  });
});
