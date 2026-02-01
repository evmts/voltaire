/**
 * Base error for secp256k1 operations
 *
 * @see https://voltaire.tevm.sh/crypto/secp256k1#error-handling
 * @since 0.0.0
 * @example
 * ```javascript
 * import { Secp256k1Error } from './crypto/Secp256k1/index.js';
 * throw new Secp256k1Error('Secp256k1 operation failed', {
 *   code: -32000,
 *   context: { operation: 'sign' },
 *   docsPath: '/crypto/secp256k1#error-handling'
 * });
 * ```
 */
export class Secp256k1Error extends CryptoError {
    /**
     * @param {string} [message]
     * @param {{code?: number, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
     */
    constructor(message?: string, options?: {
        code?: number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
    /** @override @readonly */
    override readonly _tag: "Secp256k1Error";
}
/**
 * Error for invalid signatures in secp256k1 operations
 *
 * @see https://voltaire.tevm.sh/crypto/secp256k1#error-handling
 * @since 0.0.0
 * @example
 * ```javascript
 * import { InvalidSignatureError } from './crypto/Secp256k1/index.js';
 * throw new InvalidSignatureError('Invalid signature format', {
 *   code: -32001,
 *   context: { signatureLength: 63 },
 *   docsPath: '/crypto/secp256k1/verify#error-handling'
 * });
 * ```
 */
export class InvalidSignatureError extends BaseInvalidSignatureError {
    /**
     * @param {string} [message]
     * @param {{code?: number, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
     */
    constructor(message?: string, options?: {
        code?: number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
    /** @override @readonly */
    override readonly _tag: "InvalidSignatureError";
}
/**
 * Error for invalid public keys in secp256k1 operations
 *
 * @see https://voltaire.tevm.sh/crypto/secp256k1#error-handling
 * @since 0.0.0
 * @example
 * ```javascript
 * import { InvalidPublicKeyError } from './crypto/Secp256k1/index.js';
 * throw new InvalidPublicKeyError('Invalid public key: not on curve', {
 *   code: -32002,
 *   context: { publicKeyLength: 64 },
 *   docsPath: '/crypto/secp256k1/derive-public-key#error-handling'
 * });
 * ```
 */
export class InvalidPublicKeyError extends BaseInvalidPublicKeyError {
    /**
     * @param {string} [message]
     * @param {{code?: number, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
     */
    constructor(message?: string, options?: {
        code?: number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
    /** @override @readonly */
    override readonly _tag: "InvalidPublicKeyError";
}
/**
 * Error for invalid private keys in secp256k1 operations
 *
 * @see https://voltaire.tevm.sh/crypto/secp256k1#error-handling
 * @since 0.0.0
 * @example
 * ```javascript
 * import { InvalidPrivateKeyError } from './crypto/Secp256k1/index.js';
 * throw new InvalidPrivateKeyError('Private key out of valid range', {
 *   code: -32003,
 *   context: { privateKeyLength: 32 },
 *   docsPath: '/crypto/secp256k1/sign#error-handling'
 * });
 * ```
 */
export class InvalidPrivateKeyError extends BaseInvalidPrivateKeyError {
    /**
     * @param {string} [message]
     * @param {{code?: number, context?: Record<string, unknown>, docsPath?: string, cause?: Error}} [options]
     */
    constructor(message?: string, options?: {
        code?: number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
    /** @override @readonly */
    override readonly _tag: "InvalidPrivateKeyError";
}
import { CryptoError } from "../../primitives/errors/index.js";
import { InvalidSignatureError as BaseInvalidSignatureError } from "../../primitives/errors/index.js";
import { InvalidPublicKeyError as BaseInvalidPublicKeyError } from "../../primitives/errors/index.js";
import { InvalidPrivateKeyError as BaseInvalidPrivateKeyError } from "../../primitives/errors/index.js";
//# sourceMappingURL=errors.d.ts.map