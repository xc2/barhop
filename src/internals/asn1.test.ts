import { expect, test } from "vitest";
import { PrivateKeyCases } from "./__fixtures__/keys";
import { parseAsn1 } from "./asn1";
import { parsePEM } from "./pem";

test("asn1", () => {
  const der = parsePEM(PrivateKeyCases["pkcs8 plain"].pem).body;
  const derIter = parseAsn1(der)[Symbol.iterator]();
  const first = derIter.next().value;
  expect(first).toBeDefined();
  expect(first!.tag).toBe(0x30);
  const seqIter = parseAsn1(first!.value)[Symbol.iterator]();
  const version = seqIter.next().value;
  expect(version).toBeDefined();
  expect(version!.tag).toBe(0x02);
  expect(version!.value[0]).toBe(0);
});
