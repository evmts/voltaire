/**
 * Encrypt private key to Web3 Secret Storage v3 keystore
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('../../primitives/PrivateKey/PrivateKeyType.js').PrivateKeyType} privateKey - Private key (32 bytes)
 * @param {string} password - Password for encryption
 * @param {import('./KeystoreType.js').EncryptOptions} [options] - Encryption options
 * @returns {Promise<import('./KeystoreType.js').KeystoreV3>} Encrypted keystore
 * @throws {EncryptionError} If encryption fails
 * @example
 * ```javascript
 * import * as Keystore from './crypto/Keystore/index.js';
 * import * as PrivateKey from './primitives/PrivateKey/index.js';
 *
 * const privateKey = PrivateKey.from('0x...');
 * const keystore = await Keystore.encrypt(privateKey, 'my-password');
 * ```
 */
export function encrypt(privateKey: import("../../primitives/PrivateKey/PrivateKeyType.js").PrivateKeyType, password: string, options?: import("./KeystoreType.js").EncryptOptions): Promise<import("./KeystoreType.js").KeystoreV3>;
//# sourceMappingURL=encrypt.d.ts.map