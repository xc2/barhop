import { type PrivateKeyCaseNames, PrivateKeyCases } from "src/__fixtures__/keys";
import { describe, expect, test } from "vitest";
import { EncryptedKeyNotSupported } from "./exceptions";
import {
  type DataToSign,
  canonicalizeData,
  canonicalizeMethod,
  canonicalizePath,
  canonicalizeTime,
  canonicalizeUserId,
  hashBody,
  importKey,
  sign,
} from "./sign";

describe("import key", () => {
  const BasicKeyPairShape = {
    type: "private",
    extractable: true,
    algorithm: { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-256" } },
    usages: ["sign"],
  };
  test.each(["pkcs1 plain", "pkcs8 plain"] as typeof PrivateKeyCaseNames)(
    "should import plain private key - %s",
    async (name) => {
      const c = PrivateKeyCases[name];
      await expect(importKey(c.pem)).resolves.toMatchObject(BasicKeyPairShape);
      if (c.der.byteLength) {
        await expect(importKey(c.der)).resolves.toMatchObject(BasicKeyPairShape);
      }
    }
  );

  test.each(["pkcs1 encrypted", "pkcs8 encrypted"] as typeof PrivateKeyCaseNames)(
    "encrypted key should throw - %s",
    async (name) => {
      const c = PrivateKeyCases[name];
      await expect(importKey(c.pem)).rejects.toThrow(EncryptedKeyNotSupported);
      if (c.der.byteLength) {
        await expect(importKey(c.pem)).rejects.toThrow(EncryptedKeyNotSupported);
      }
    }
  );
});

describe("canonicalize#method", () => {
  test("should be uppercase", () => {
    expect(canonicalizeMethod("post")).toBe("POST");
  });
  test("should use GET as default", () => {
    expect(canonicalizeMethod("")).toBe("GET");
    expect(canonicalizeMethod(undefined)).toBe("GET");
    // @ts-ignore
    expect(canonicalizeMethod(null)).toBe("GET");
  });
});

describe("canonicalize#path", () => {
  test("should be path only", () => {
    expect(canonicalizePath("https://example.com/foo/bar/abc?a=1#foo")).toBe("/foo/bar/abc");
  });
  test("should remove leading duplicate slashes", () => {
    expect(canonicalizePath("//example.com/foo/bar/abc")).toBe("/example.com/foo/bar/abc");
  });
  test("should remove trailing slashes", () => {
    expect(canonicalizePath("/foo/bar/abc//")).toBe("/foo/bar/abc");
  });
});
describe("canonicalize#userId", () => {
  test("can be string", () => {
    expect(canonicalizeUserId("123")).toBe("123");
  });
  test("can be number", () => {
    expect(canonicalizeUserId(123)).toBe("123");
  });
  test("can be empty", () => {
    // @ts-ignore
    expect(canonicalizeUserId(undefined)).toBe("");
  });
});

describe("canonicalize#time", () => {
  test("should be UTC RFC3339", () => {
    expect(canonicalizeTime(new Date("2021-01-01T00:00:00Z"))).toBe("2021-01-01T00:00:00Z");
  });
  test("should be current time if not provided", () => {
    const safeArea = [-2, -1, 0, 1, 2].map((v) =>
      canonicalizeTime(new Date(Date.now() + v * 1000))
    );
    expect(safeArea).toContain(canonicalizeTime(undefined));
  });
});

describe("canonicalize#hashBody", () => {
  test("string", async () => {
    // echo -n "$INPUT" | openssl dgst -sha256 -binary | base64
    const cases: [string, string][] = [
      ["hello", "LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ="],
      ["你好", "Zw2XQ1Qsrj6n6+Nq9WvVNkiwoRJhYueNgaMpNKcRMC4="],
      ["😊🧑", "/mu22C5r+6shzGWpvR3pzoaPLOl3AiwGmJVVrrpHedg="],
    ];
    for (const [input, output] of cases) {
      await expect(hashBody(input)).resolves.toBe(output);
    }
  });
  test("empty", async () => {
    await expect(hashBody("")).resolves.toBe("47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=");
    await expect(hashBody(null)).resolves.toBe("47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=");
  });
  test("Uint8Array", async () => {
    const input = new Uint8Array([1, 2, 3, 4]);
    // echo -n -e "\x01\x02\x03\x04" | openssl dgst -sha256 -binary | base64
    await expect(hashBody(input)).resolves.toBe("n2SnR+G5fxMfq7a0Rylsm28CAeefs8U1bmx36JtqgGo=");
  });
});

describe("canonicalizeData", () => {
  const canonicalized = canonicalizeData({
    method: "GET",
    path: "/foo",
    body: "hello",
    userId: "123",
  });
  test("should be in correct name and order", () => {
    expect(canonicalized.map(([k]) => k)).toEqual([
      "Method",
      "Path",
      "X-Ops-Content-Hash",
      "X-Ops-Sign",
      "X-Ops-Timestamp",
      "X-Ops-UserId",
      "X-Ops-Server-API-Version",
    ]);
  });
  test('sign version should be "version=1.3"', () => {
    expect(Object.fromEntries(canonicalized)).toMatchObject({
      "X-Ops-Sign": "version=1.3",
      "X-Ops-Server-API-Version": "0",
    });
  });
});

describe("sign", () => {
  const key = importKey(PrivateKeyCases["pkcs1 plain"].pem);
  const data: DataToSign = {
    method: "POST",
    userId: "spec-user",
    body: "Spec Body",
    path: "/organizations/clownco",
    time: new Date("2009-01-01T12:00:00Z"),
    apiVer: 1,
  };
  test("should sign correctly and return headers", async () => {
    await expect(sign(key, data)).resolves.toEqual({
      Method: "POST",
      Path: "/organizations/clownco",
      "X-Ops-Content-Hash": "hDlKNZhIhgso3Fs0S0pZwJ0xyBWtR1RBaeHs1DrzOho=",
      "X-Ops-Server-API-Version": "1",
      "X-Ops-Sign": "version=1.3",
      "X-Ops-Timestamp": "2009-01-01T12:00:00Z",
      "X-Ops-UserId": "spec-user",
      "X-Ops-Authorization-1": "FZOmXAyOBAZQV/uw188iBljBJXOm+m8xQ/8KTGLkgGwZNcRFxk1m953XjE3W",
      "X-Ops-Authorization-2": "VGy1dFT76KeaNWmPCNtDmprfH2na5UZFtfLIKrPv7xm80V+lzEzTd9WBwsfP",
      "X-Ops-Authorization-3": "42dZ9N+V9I5SVfcL/lWrrlpdybfceJC5jOcP5tzfJXWUITwb6Z3Erg3DU3Uh",
      "X-Ops-Authorization-4": "H9h9E0qWlYGqmiNCVrBnpe6Si1gU/Jl+rXlRSNbLJ4GlArAPuL976iTYJTzE",
      "X-Ops-Authorization-5": "MmbLUIm3JRYi00Yb01IUCCKdI90vUq1HHNtlTEu93YZfQaJwRxXlGkCNwIJe",
      "X-Ops-Authorization-6": "fy49QzaCIEu1XiOx5Jn+4GmkrZch/RrK9VzQWXgs+w==",
    });
  });
});
