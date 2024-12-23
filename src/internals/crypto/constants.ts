export const PrivateKeyType = {
  LegacyRSA: "RSAPrivateKey",
  PKCS8RSA: "PrivateKeyInfo",
  EncryptedPKCS8RSA: "EncryptedPrivateKeyInfo",
} as const;

export type PrivateKeyTypes = (typeof PrivateKeyType)[keyof typeof PrivateKeyType];
