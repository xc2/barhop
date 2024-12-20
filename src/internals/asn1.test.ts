import { describe, expect, test } from "vitest";
import { PrivateKeyCases } from "./__fixtures__/keys";
import { buildBlock, iterBlock } from "./asn1";
import { parsePEM } from "./pem";

describe("e2e", () => {
  test("pkcs8", () => {
    const der = parsePEM(PrivateKeyCases["pkcs8 plain"].pem).body;
    const derIter = iterBlock(der);
    const first = derIter.next().value;
    expect(first).toBeDefined();
    expect(first!.tag).toBe(0x30); // SEQUENCE
    const seqIter = iterBlock(first!.value);
    const version = seqIter.next().value;
    expect(version).toBeDefined();
    expect(version!.tag).toBe(0x02); // INTEGER - version
    expect(version!.value[0]).toBe(0);
  });
  test("pkcs1", () => {
    const der = parsePEM(PrivateKeyCases["pkcs1 plain"].pem).body;
    const derIter = iterBlock(der);
    const seq = derIter.next().value;
    expect(seq).toBeDefined();
    expect(seq!.tag).toBe(0x30); // SEQUENCE
    const [version, n, e, d, p, q, dp, dq, qi] = Array.from(iterBlock(seq!.value));
    for (const block of [version, n, e, d, p, q, dp, dq, qi]) {
      expect(block).toBeDefined();
      expect(block!.tag).toBe(0x02); // all component of PKCS#1 are INTEGER
    }
  });
});

describe("should build correct length", () => {
  test("short form", () => {
    const block = buildBlock(0x04, [0]);
    expect(block).toEqual(Uint8Array.from([0x04, 0x01, 0x00]));
  });

  test("long form with 2 bytes length", () => {
    const data = new Uint8Array(0x123);
    const block = buildBlock(0x04, data);
    expect(block.subarray(0, 4)).toEqual(Uint8Array.from([0x04, 0x82, 0x01, 0x23]));
  });
  test("long form with > 2 bytes length", () => {
    const data = new Uint8Array(0x12345);
    const block = buildBlock(0x04, data);
    expect(block.subarray(0, 5)).toEqual(Uint8Array.from([0x04, 0x83, 0x01, 0x23, 0x45]));
  });
});
