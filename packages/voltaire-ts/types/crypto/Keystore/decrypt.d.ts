/**
 * Decrypt Web3 Secret Storage v3 keystore to private key
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./KeystoreType.js').KeystoreV3} keystore - Encrypted keystore
 * @param {string} password - Password for decryption
 * @returns {import('../../primitives/PrivateKey/PrivateKeyType.js').PrivateKeyType} Decrypted private key
 * @throws {UnsupportedVersionError} If keystore version is not 3
 * @throws {UnsupportedKdfError} If KDF is not scrypt or pbkdf2
 * @throws {InvalidMacError} If MAC verification fails (wrong password or corrupted)
 * @throws {DecryptionError} If cipher is not aes-128-ctr, IV is not 16 bytes, MAC is not 32 bytes, dklen is outside [32, 128], or decryption fails
 * @example
 * ```javascript
 * import * as Keystore from './crypto/Keystore/index.js';
 *
 * const keystore = { version: 3, id: '...', crypto: { ... } };
 * const privateKey = Keystore.decrypt(keystore, 'my-password');
 * ```
 */
export function decrypt(keystore: import("./KeystoreType.js").KeystoreV3, password: string): import("../../primitives/PrivateKey/PrivateKeyType.js").PrivateKeyType;
//# sourceMappingURL=decrypt.d.ts.map