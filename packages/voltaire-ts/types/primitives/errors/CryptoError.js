import { PrimitiveError } from "./PrimitiveError.js";
/**
 * Base crypto error
 *
 * @example
 * ```typescript
 * throw new CryptoError('Cryptographic operation failed', {
 *   code: 'CRYPTO_ERROR',
 *   context: { operation: 'sign' },
 *   docsPath: '/crypto/secp256k1/sign#error-handling',
 *   cause: originalError
 * })
 * ```
 */
export class CryptoError extends PrimitiveError {
    _tag = "CryptoError";
    constructor(message, options) {
        super(message, {
            code: options?.code,
            context: options?.context,
            docsPath: options?.docsPath,
            cause: options?.cause,
        });
        this.name = "CryptoError";
    }
}
/**
 * Invalid signature error (e.g., signature verification failed)
 *
 * @throws {InvalidSignatureError}
 */
export class InvalidSignatureError extends CryptoError {
    _tag = "InvalidSignatureError";
    constructor(message, options) {
        super(message, {
            code: options?.code,
            context: options?.context,
            docsPath: options?.docsPath,
            cause: options?.cause,
        });
        this.name = "InvalidSignatureError";
    }
}
/**
 * Invalid public key error (e.g., malformed public key)
 *
 * @throws {InvalidPublicKeyError}
 */
export class InvalidPublicKeyError extends CryptoError {
    _tag = "InvalidPublicKeyError";
    constructor(message, options) {
        super(message, {
            code: options?.code,
            context: options?.context,
            docsPath: options?.docsPath,
            cause: options?.cause,
        });
        this.name = "InvalidPublicKeyError";
    }
}
/**
 * Invalid private key error (e.g., out of range private key)
 *
 * @throws {InvalidPrivateKeyError}
 */
export class InvalidPrivateKeyError extends CryptoError {
    _tag = "InvalidPrivateKeyError";
    constructor(message, options) {
        super(message, {
            code: options?.code,
            context: options?.context,
            docsPath: options?.docsPath,
            cause: options?.cause,
        });
        this.name = "InvalidPrivateKeyError";
    }
}
