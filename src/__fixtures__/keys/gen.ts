import type { KeyExportOptions } from "crypto";
import * as NodeCrypto from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { chdir } from "node:process";

const pkcs1pem = `-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEAtcaaXV3vfUmiWZJnTOFRDkSu8b+RVLZxSiuGb4hvmRpTIbcw
yZhVn6tBQPfbTQxjF47x56z2OBlCsGoqsvQii1c2pRCiLFS+9jYuLeSbJswCgFXP
BWg72WOmpzgknWEQC+9WMgJ8Du4SE6+0uuk1bYvTZJjG5lmovvSwkicrPw/HKXmj
FtiM6GF+UJ97jaufTqqLQMrSdNVtr8lIMl4asIQk8RQfzIJoq5jMB8S9Ktfl+2/9
b/veJKejpot1OzjRVEOqe9GJ24OOqbiAiN7o8fMZnFd8G7BzSkfLeIylrN2CM1Jc
REoXCwWkGBUfvaoKHAi+0gilKa2N1ZnBIwcGDQIDAQABAoIBADgNavJZkg0PVLnM
NIB3hlghA9VWHkmCDMMzUrw31Tnf7TybUbcIe3bGB1QyWfSTWkccdCndovs/htoB
kvMl5zUSiq4xx+BlrZEcufa65MD87dSHIVRohPQPD4fG/ztsf9c+UVUQgRLVhMt/
RfrRCQGjuWbu2X6UrT1dFMmsvGAwRmhN/3vLZItYy5JIQ49OzGV47ScGORTZ7ZbY
3dCK1+bgVlYVxRLjqeD8cuJPtGUGIPpp9ysYfmZNjzc0x4gq9tLSM7HgvpFKq/SR
J6b1ynGXxhi5YEmeScxC2AdB0R8YK4oWf6MiY5zjZ8JWG0yIEs2B6hotRL9sHiEh
g20DyF0CgYEA8k2+/qhfQ8Uyf25icxGgG1ifbPhkOads0bE7mSdoNJLhQsbBNzB5
2P6r5Y9HuhQEAlimTIQ+5X8FLpdDDJiRJCoX3ZCqOKBNMy7A4aq/zlvjrZsTv7Lm
U80Hy4itk0LiIlzb31N9ROde+JNeoFzbdWdhulrY1LyfG2CI9q7Qr38CgYEAwAz9
ArthZyZ8S2UsTRxJL2n5MseXdF6N2/f8YLN4N7/eE5oJzUBzKYc47tjUsDvSvIYo
5MGIr4tzfeeYYfxMJygbH5LkhygrfELZKjKIbhYW0t9Vr5O89/9QIne4jrw0Kv9x
Lw1TxbI2VoWdLfsH0lbGt371wmgn4G83uVvP0HMCgYBgG9x1UD2xOOfFyff84nHa
RvW9mGzQvYsZRa55GjtoFxaIkSOUi4LZQnLWdFWkBkpsz9LuqMn158Mbbt4mgeGY
MaYTuUz7dwIIGjRhjoPUC3ispMVZlVFszfeYkNcggTgHH0QLOieHDCsMeA/hldNq
px4Jd/1nrIWDq2/IQSD/awKBgDYXsm/BjWa7TUkDHx48+FQVei4WT49kTnqFd51Z
D2RMc2V7/oTEQWuR/bQweH+G6g1VkFEWPcSL96SfxajboitpPXKAMkPrSYw/W+Fp
yEmRiS4t33mLmC8Vx2Fd7Squ0dbGif+htlW5o1ptWd8olIRnEqN+bAQsyAaL7NsV
hAwHAoGAI9qvwzBLivQRREUobpsB9c0Go1O0eo31ZgUll36kuDEHDFISqhVdj0ku
5z8uB1J0CZdyxkfLaN7JPFH+EMu+RLdtYqYDqqoPlJDIPq0Dbwp2vKIZ+chGcvlh
yJJtqETUstU5okypWhYfSOn8a/T7Q452NW18Lw0p1+jiFf6zAXQ=
-----END RSA PRIVATE KEY-----`;

chdir(dirname(new URL(import.meta.url).pathname));

const k = NodeCrypto.createPrivateKey({ key: pkcs1pem });
exportKey("pkcs1-plain.pem", { type: "pkcs1", format: "pem" });
exportKey("pkcs1-plain.der.txt", { type: "pkcs1", format: "der" });
exportKey("pkcs1-encrypted.pem", {
  type: "pkcs1",
  format: "pem",
  cipher: "AES-128-CBC",
  passphrase: "12345",
});
exportKey("pkcs8-plain.pem", { type: "pkcs8", format: "pem" });
exportKey("pkcs8-plain.der.txt", { type: "pkcs8", format: "der" });
exportKey("pkcs8-encrypted.pem", {
  type: "pkcs8",
  format: "pem",
  cipher: "AES-128-CBC",
  passphrase: "12345",
});

exportKey("pkcs8-encrypted.der.txt", {
  type: "pkcs8",
  format: "der",
  cipher: "AES-128-CBC",
  passphrase: "12345",
});

function exportKey(filename: string, options: KeyExportOptions<"pem"> | KeyExportOptions<"der">) {
  const p = new URL(`./${filename}`, import.meta.url).pathname;
  const isBinary = options.format === "der";
  try {
    let existing = readFileSync(p);
    if (isBinary) {
      existing = Buffer.from(existing.toString("binary"), "base64");
    }

    const key = NodeCrypto.createPrivateKey({
      type: options.type as any,
      key: existing,
      format: options.format,
      passphrase: options.passphrase,
    });
    const a = key.export({ type: "pkcs1", format: "pem" }) as string;
    if (a.trim() === pkcs1pem.trim()) {
      console.log(`${filename} does not need to be updated`);
      return;
    }
  } catch {}

  const e = k.export(options as any);
  if (Buffer.isBuffer(e)) {
    writeFileSync(p, e.toString("base64"));
  } else {
    writeFileSync(p, e);
  }
  console.log(`${filename} written`);
}