/**
 * Encrypt data with AES-128-CTR
 *
 * @param {Uint8Array} data - Data to encrypt
 * @param {Uint8Array} key - 16-byte AES key
 * @param {Uint8Array} iv - 16-byte initialization vector
 * @returns {Uint8Array} Ciphertext
 */
export function encryptAesCtr(data: Uint8Array, key: Uint8Array, iv: Uint8Array): Uint8Array;
/**
 * Decrypt data with AES-128-CTR
 *
 * @param {Uint8Array} ciphertext - Encrypted data
 * @param {Uint8Array} key - 16-byte AES key
 * @param {Uint8Array} iv - 16-byte initialization vector
 * @returns {Uint8Array} Plaintext
 */
export function decryptAesCtr(ciphertext: Uint8Array, key: Uint8Array, iv: Uint8Array): Uint8Array;
//# sourceMappingURL=aesCtr.d.ts.map