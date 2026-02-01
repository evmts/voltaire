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
export declare class CryptoError extends PrimitiveError {
    readonly _tag: string;
    constructor(message: string, options?: {
        code?: number | string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Invalid signature error (e.g., signature verification failed)
 *
 * @throws {InvalidSignatureError}
 */
export declare class InvalidSignatureError extends CryptoError {
    readonly _tag: string;
    constructor(message: string, options?: {
        code?: number | string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Invalid public key error (e.g., malformed public key)
 *
 * @throws {InvalidPublicKeyError}
 */
export declare class InvalidPublicKeyError extends CryptoError {
    readonly _tag: string;
    constructor(message: string, options?: {
        code?: number | string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Invalid private key error (e.g., out of range private key)
 *
 * @throws {InvalidPrivateKeyError}
 */
export declare class InvalidPrivateKeyError extends CryptoError {
    readonly _tag: string;
    constructor(message: string, options?: {
        code?: number | string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
//# sourceMappingURL=CryptoError.d.ts.map