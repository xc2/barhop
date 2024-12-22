export * from "./internals/encoding/exceptions";

// MARK: sign
export class EncryptedKeyNotSupported extends Error {
  constructor() {
    super("Encrypted keys are not supported currently");
  }
}
export class UnsupportedKeyType extends Error {
  constructor(type?: string) {
    super(
      `Only PKCS#1 and PKCS#8 private keys are supported.` + (type ? ` Received: ${type}` : "")
    );
  }
}
// MARK: - sign -
