import { describe, expect, test } from "vitest";
import { PrivateKeyCases } from "./__fixtures__/keys";
import { parsePEM } from "./pem";
import { pkcs1To8, validatePKCS1Or8 } from "./rsa";

test("convert PKCS#1 to PKCS#8", () => {
  const pkcs1 = parsePEM(PrivateKeyCases["pkcs1 plain"].pem);
  const pkcs8Expected = parsePEM(PrivateKeyCases["pkcs8 plain"].pem);
  const pkcs8 = pkcs1To8(pkcs1.body);

  expect(pkcs8).toEqual(pkcs8Expected.body);
});

describe("key type detection", () => {
  test("PKCS#1", () => {
    expect(validatePKCS1Or8(parsePEM(PrivateKeyCases["pkcs1 plain"].pem).body)).toBe(
      "RSAPrivateKey"
    );
  });
  test("PKCS#8", () => {
    expect(validatePKCS1Or8(parsePEM(PrivateKeyCases["pkcs8 plain"].pem).body)).toBe(
      "PrivateKeyInfo"
    );
  });
  test("PKCS#8 Encrypted", () => {
    expect(validatePKCS1Or8(parsePEM(PrivateKeyCases["pkcs8 encrypted"].pem).body)).toBe(
      "EncryptedPrivateKeyInfo"
    );
  });
});
