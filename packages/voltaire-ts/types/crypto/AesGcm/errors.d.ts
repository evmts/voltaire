/**
 * Base error for AES-GCM operations
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { AesGcmError } from './crypto/AesGcm/index.js';
 * throw new AesGcmError('Operation failed', {
 *   code: -32020,
 *   context: { operation: 'encrypt' },
 *   docsPath: '/crypto/aes-gcm#error-handling',
 *   cause: originalError
 * });
 * ```
 */
export class AesGcmError extends CryptoError {
    /**
     * @param {string} message
     * @param {{code?: number, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
     */
    constructor(message: string, options?: {
        code?: number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Invalid key error
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { InvalidKeyError } from './crypto/AesGcm/index.js';
 * throw new InvalidKeyError('Invalid key size', {
 *   code: -32021,
 *   context: { size: 16, expected: '16, 24, or 32 bytes' },
 *   docsPath: '/crypto/aes-gcm/import-key#error-handling'
 * });
 * ```
 */
export class InvalidKeyError extends AesGcmError {
}
/**
 * Invalid nonce error
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { InvalidNonceError } from './crypto/AesGcm/index.js';
 * throw new InvalidNonceError('Nonce must be 12 bytes', {
 *   code: -32022,
 *   context: { length: 8, expected: 12 },
 *   docsPath: '/crypto/aes-gcm/encrypt#error-handling'
 * });
 * ```
 */
export class InvalidNonceError extends AesGcmError {
}
/**
 * Decryption failure error
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { DecryptionError } from './crypto/AesGcm/index.js';
 * throw new DecryptionError('Authentication failed', {
 *   code: -32023,
 *   context: { operation: 'decrypt' },
 *   docsPath: '/crypto/aes-gcm/decrypt#error-handling',
 *   cause: originalError
 * });
 * ```
 */
export class DecryptionError extends AesGcmError {
}
import { CryptoError } from "../../primitives/errors/CryptoError.js";
//# sourceMappingURL=errors.d.ts.map