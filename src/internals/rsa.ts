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
  // biome-ignore format: constructor
  const header = new Uint8Array([
    // PrivateKeyInfo := SEQUENCE {
      0x30, // SEQUENCE
      0x82, // Length field, 2 bytes
      0x00, 0x00, // Placeholder for `totalLength`

      // version (v1)
      0x02, // INTEGER
      0x01, // Length
      0x00, // Value

      // algorithm AlgorithmIdentifier  ::= SEQUENCE {
        0x30, // SEQUENCE
        0x0d, // Length

        // algorithm
        0x06, // OBJECT IDENTIFIER
        0x09, // Length
        0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, // rsaEncryption OID (1.2.840.113549.1.1.1)

        // parameters
        0x05, // NULL
        0x00, // Length
      // } end AlgorithmIdentifier

      // PrivateKey
      0x04, // OCTET STRING
      0x82, // Length field, 2 bytes
      0x00, 0x00, // Placeholder for `pkcs1Length`
    // } end PrivateKeyInfo
  ]);

  // Calculate lengths
  const totalLength = header.length + pkcs1Body.length - 4; // -4 for sequence header
  const pkcs1Length = pkcs1Body.length;

  // Write the lengths
  const dataView = new DataView(header.buffer);
  dataView.setUint16(2, totalLength);
  dataView.setUint16(header.length - 2, pkcs1Length);

  // Combine the arrays
  const der = new Uint8Array(header.length + pkcs1Body.length);
  der.set(header);
  der.set(pkcs1Body, header.length);
  return der;
}
