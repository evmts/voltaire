/**
 * Base error for X25519 operations
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { X25519Error } from './crypto/X25519/index.js';
 * throw new X25519Error('Invalid operation', {
 *   code: -32000,
 *   context: { operation: 'scalarmult' },
 *   docsPath: '/crypto/x25519#error-handling'
 * });
 * ```
 */
export class X25519Error extends CryptoError {
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
    /** @override @readonly */
    override readonly _tag: "X25519Error";
}
/**
 * Error thrown when secret key is invalid
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { InvalidSecretKeyError } from './crypto/X25519/index.js';
 * throw new InvalidSecretKeyError('Invalid secret key', {
 *   code: -32003,
 *   context: { length: 16, expected: 32 },
 *   docsPath: '/crypto/x25519/scalarmult#error-handling'
 * });
 * ```
 */
export class InvalidSecretKeyError extends InvalidPrivateKeyError {
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
    /** @override @readonly */
    override readonly _tag: "InvalidSecretKeyError";
}
/**
 * Error thrown when public key is invalid
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import { InvalidPublicKeyError } from './crypto/X25519/index.js';
 * throw new InvalidPublicKeyError('Invalid public key', {
 *   code: -32002,
 *   context: { length: 16, expected: 32 },
 *   docsPath: '/crypto/x25519/scalarmult#error-handling'
 * });
 * ```
 */
export class InvalidPublicKeyError extends BaseInvalidPublicKeyError {
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
    /** @override @readonly */
    override readonly _tag: "InvalidPublicKeyError";
}
import { CryptoError } from "../../primitives/errors/CryptoError.js";
import { InvalidPrivateKeyError } from "../../primitives/errors/CryptoError.js";
import { InvalidPublicKeyError as BaseInvalidPublicKeyError } from "../../primitives/errors/CryptoError.js";
//# sourceMappingURL=errors.d.ts.map