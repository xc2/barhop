import type { KeyExportOptions } from "crypto";
import * as NodeCrypto from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { chdir } from "node:process";

const pkcs1pem = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0ueqo76MXuP6XqZBILFziH/9AI7C6PaN5W0dSvkr9yInyGHS
z/IR1+4tqvP2qlfKVKI4CP6BFH251Ft9qMUBuAsnlAVQ1z0exDtIFFOyQCdR7iXm
jBIWMSS4buBwRQXwDK7id1OxtU23qVJv+xwEV0IzaaSJmaGLIbvRBD+qatfUuQJB
MU/04DdJIwvLtZBYdC2219m5dUBQaa4bimL+YN9EcsDzD9h9UxQo5ReK7b3cNMzJ
BKJWLzFBcJuePMzAnLFktr/RufX4wpXe6XJxoVPaHo72GorLkwnQ0HYMTY8rehT4
mDi1FI969LHCFFaFHSAaRnwdXaQkJmSfcxzCYQIDAQABAoIBAQCW3I4sKN5B9jOe
xq/pkeWBq4OvhW8Ys1yW0zFT8t6nHbB1XrwscQygd8gE9BPqj3e0iIEqtdphbPmj
VHqTYbC0FI6QDClifV7noTwTBjeIOlgZ0NSUN0/WgVzIOxUz2mZ2vBZUovKILPqG
TOi7J7RXMoySMdcXpP1f+PgvYNcnKsT72UcWaSXEV8/zo+Zm/qdGPVWwJonri5Mp
DVm5EQSENBiRyt028rU6ElXORNmoQpVjDVqZ1gipzXkifdjGyENw2rt4V/iKYD7V
5iqXOsvP6Cemf4gbrjunAgDG08S00kiUgvVWcdXW+dlsR2nCvH4DOEe3AYYh/aH8
DxEE7FbtAoGBAPcNO8fJ56mNw0ow4Qg38C+Zss/afhBOCfX4O/SZKv/roRn5+gRM
KRJYSVXNnsjPI1plzqR4OCyOrjAhtuvL4a0DinDzf1+fiztyNohwYsW1vYmqn3ti
EN0GhSgE7ppZjqvLQ3f3LUTxynhA0U+k9wflb4irIlViTUlCsOPkrNJDAoGBANqL
Q+vvuGSsmRLU/Cenjy+Mjj6+QENg51dz34o8JKuVKIPKU8pNnyeLa5fat0qD2MHm
OB9opeQOcw0dStodxr6DB3wi83bpjeU6BWUGITNiWEaZEBrQ0aiqNJJKrrHm8fAZ
9o4l4oHc4hI0kYVYYDuxtKuVJrzZiEapTwoOcYiLAoGBAI/EWbeIHZIj9zOjgjEA
LHvm25HtulLOtyk2jd1njQhlHNk7CW2azIPqcLLH99EwCYi/miNH+pijZ2aHGCXb
/bZrSxM0ADmrZKDxdB6uGCyp+GS2sBxjEyEsfCyvwhJ8b3Q100tqwiNO+d5FCglp
HICx2dgUjuRVUliBwOK93nx1AoGAUI8RhIEjOYkeDAESyhNMBr0LGjnLOosX+/as
qiotYkpjWuFULbibOFp+WMW41vDvD9qrSXir3fstkeIAW5KqVkO6mJnRoT3Knnra
zjiKOITCAZQeiaP8BO5o3pxE9TMqb9VCO3ffnPstIoTaN4syPg7tiGo8k1SklVeH
2S8lzq0CgYAKG2fljIYWQvGH628rp4ZcXS4hWmYohOxsnl1YrszbJ+hzR+IQOhGl
YlkUQYXhy9JixmUUKtH+NXkKX7Lyc8XYw5ETr7JBT3ifs+G7HruDjVG78EJVojbd
8uLA+DdQm5mg4vd1GTiSK65q/3EeoBlUaVor3HhLFki+i9qpT8CBsg==
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
