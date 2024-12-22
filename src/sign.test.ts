import { PrivateKeyCases } from "src/__fixtures__/keys";
import { describe, expect, test } from "vitest";
import { parsePEM } from "./internals/encoding/pem";
import { importKey } from "./sign";

describe("import key", () => {
  const BasicKeyPairShape = {
    type: "private",
    extractable: true,
    algorithm: { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-256" } },
    usages: ["sign"],
  };
  test("pkcs#1 pem", async () => {
    await expect(importKey(PrivateKeyCases["pkcs1 plain"].pem)).resolves.toMatchObject(
      BasicKeyPairShape
    );
  });
  test("pkcs#1 der", async () => {
    await expect(
      importKey(parsePEM(PrivateKeyCases["pkcs1 plain"].pem).body)
    ).resolves.toMatchObject(BasicKeyPairShape);
  });
  test("pkcs#8 pem", async () => {
    await expect(importKey(PrivateKeyCases["pkcs8 plain"].pem)).resolves.toMatchObject(
      BasicKeyPairShape
    );
  });
  test("pkcs#8 der", async () => {
    await expect(
      importKey(parsePEM(PrivateKeyCases["pkcs8 plain"].pem).body)
    ).resolves.toMatchObject(BasicKeyPairShape);
  });
});

// describe("sign request", () => {});
