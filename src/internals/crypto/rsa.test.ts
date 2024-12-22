import { PrivateKeyCases } from "src/__fixtures__/keys";
import { describe, expect, test } from "vitest";
import { PrivateKeyType, pkcs1To8, validatePKCS1Or8 } from "./rsa";

test("convert PKCS#1 to PKCS#8", () => {
  const pkcs8Expected = PrivateKeyCases["pkcs8 plain"].der;
  const pkcs8 = pkcs1To8(PrivateKeyCases["pkcs1 plain"].der);

  expect(pkcs8).toEqual(pkcs8Expected);
});

describe("key type detection", () => {
  test("PKCS#1", () => {
    expect(validatePKCS1Or8(PrivateKeyCases["pkcs1 plain"].der)).toBe(PrivateKeyType.LegacyRSA);
  });
  test("PKCS#8", () => {
    expect(validatePKCS1Or8(PrivateKeyCases["pkcs8 plain"].der)).toBe(PrivateKeyType.PKCS8RSA);
  });
  test("PKCS#8 Encrypted", () => {
    expect(validatePKCS1Or8(PrivateKeyCases["pkcs8 encrypted"].der)).toBe(
      PrivateKeyType.EncryptedPKCS8RSA
    );
  });
});
