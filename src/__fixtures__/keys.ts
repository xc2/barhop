import PKCS1EncryptedPEM from "./keys/pkcs1-encrypted.pem?raw";
import PKCS1PlainDer from "./keys/pkcs1-plain.der.txt?raw";
import PKCS1PlainPEM from "./keys/pkcs1-plain.pem?raw";
import PKCS8EncryptedDer from "./keys/pkcs8-encrypted.der.txt?raw";
import PKCS8EncryptedPEM from "./keys/pkcs8-encrypted.pem?raw";
import PKCS8PlainDer from "./keys/pkcs8-plain.der.txt?raw";
import PKCS8PlainPEM from "./keys/pkcs8-plain.pem?raw";
interface RSAPrivateKey {
  pem: string;
  type: string;
  header: Record<string, string[]>;
  passphrase?: string;
  der: Uint8Array;
}

function fromBase64(text: string): Uint8Array {
  return Uint8Array.from(atob(text), (v) => v.charCodeAt(0));
}

export const PrivateKeyCases = {
  "pkcs1 plain": {
    type: "RSA PRIVATE KEY",
    header: {},
    pem: PKCS1PlainPEM,
    der: fromBase64(PKCS1PlainDer),
  } satisfies RSAPrivateKey,
  "pkcs1 encrypted": {
    type: "RSA PRIVATE KEY",
    passphrase: "12345",
    header: {
      "Proc-Type": ["4", "ENCRYPTED"],
      "DEK-Info": ["AES-128-CBC", "0BE5B7956C55B9940FB4C945AD49610B"],
    },
    pem: PKCS1EncryptedPEM,
    der: new Uint8Array(),
  } satisfies RSAPrivateKey,
  "pkcs8 plain": {
    type: "PRIVATE KEY",
    header: {},
    pem: PKCS8PlainPEM,
    der: fromBase64(PKCS8PlainDer),
  } as RSAPrivateKey,
  "pkcs8 encrypted": {
    type: "ENCRYPTED PRIVATE KEY",
    passphrase: "12345",
    header: {},
    pem: PKCS8EncryptedPEM,
    der: fromBase64(PKCS8EncryptedDer), // todo iv is not same as pem
  } as RSAPrivateKey,
};

export const PrivateKeyCaseNames = Object.keys(PrivateKeyCases) as (keyof typeof PrivateKeyCases)[];
