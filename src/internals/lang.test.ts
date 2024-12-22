import { describe, expect, test } from "vitest";
import { toBase64, toUint8Array } from "./lang";

function nodeBase64(text: string) {
  return Buffer.from(text).toString("base64");
}

describe("toBase64", () => {
  const seq = Array.from(new Array(10), (_, i) =>
    Array.from(new Array(i), (_, i) => i).join("")
  ).concat(["你好", "🤔🦄", "🧑", "Déjà Vu!", "♥", "♥♥"]);
  test.each(seq)("toBase64 %s", (input) => {
    expect(toBase64(toUint8Array(input))).toBe(nodeBase64(input));
  });
});
