import { buildBlock, getOID, iterBlock } from "./asn1";
import { concatUint8 } from "./lang";

export function pkcs1To8(pkcs1Body: Uint8Array) {
  /**
   * PKCS#8 wrapper ASN.1 structure
   * ```
   *     PrivateKeyInfo ::= SEQUENCE {
   *       version Version,
   *       algorithm   AlgorithmIdentifier,
   *       PrivateKey  OCTET STRING
   *     }
   *
   *     AlgorithmIdentifier ::= SEQUENCE {
   *       algorithm   OBJECT IDENTIFIER,
   *       parameters  ANY DEFINED BY algorithm OPTIONAL
   *     }
   * ```
   */
  return buildBlock(
    0x30, // SEQUENCE
    concatUint8(
      // version Version
      buildBlock(0x02, 0), // INTEGER 0
      // algorithm AlgorithmIdentifier
      buildBlock(
        0x30, // SEQUENCE
        concatUint8(
          // algorithm
          buildBlock(
            0x06, // OBJECT
            // @biome-ignore format: oid
            [0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01] // rsaEncryption OID (1.2.840.113549.1.1.1)
          ),
          // parameters ANY DEFINED BY algorithm OPTIONAL
          buildBlock(0x05, null) // NULL
        )
      ),
      // PrivateKey
      buildBlock(0x04, pkcs1Body) // OCTET STRING
    )
  );
}

/**
 * Validate if the DER is PKCS#1 or PKCS#8
 * @param der
 * @see https://mbed-tls.readthedocs.io/en/latest/kb/cryptography/asn1-key-structures-in-der-and-pem/
 */
export function validatePKCS1Or8(
  der: Uint8Array
): false | "RSAPrivateKey" | "PrivateKeyInfo" | "EncryptedPrivateKeyInfo" {
  const derIter = iterBlock(der);
  const root = derIter.next().value;
  if (root?.tag !== 0x30) {
    return false;
  }
  const iter = root.sub();
  const first = iter.next().value;
  if (first?.tag === 0x30) {
    // The first item of EncryptedPrivateKeyInfo is encryptionAlgorithm SEQUENCE
    const oid = first.sub().next().value;
    return oid?.tag === 0x06 ? "EncryptedPrivateKeyInfo" : false;
  }
  if (first?.tag !== 0x02) {
    // The first item of PKCS#1 and PKCS#8 is version INTEGER
    return false;
  }
  const second = iter.next().value;
  if (second?.tag === 0x30) {
    // algorithm AlgorithmIdentifier SEQUENCE
    // PKCS#8
    const oid = getOID(second.value);
    return oid === "1.2.840.113549.1.1.1" ? "PrivateKeyInfo" : false;
  }
  if (second?.tag === 0x02) {
    // modulus   INTEGER,  -- n
    // PKCS#1
    return "RSAPrivateKey";
  }
  return false;
}
