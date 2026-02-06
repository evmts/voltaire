/**
 * Base error for P256 operations
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export class P256Error extends CryptoError {
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
    override readonly _tag: "P256Error";
}
/**
 * Error for invalid signatures
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export class InvalidSignatureError extends BaseInvalidSignatureError {
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
    override readonly _tag: "InvalidSignatureError";
}
/**
 * Error for invalid public keys
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
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
/**
 * Error for invalid private keys
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export class InvalidPrivateKeyError extends BaseInvalidPrivateKeyError {
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
    override readonly _tag: "InvalidPrivateKeyError";
}
import { CryptoError } from "../../primitives/errors/CryptoError.js";
import { InvalidSignatureError as BaseInvalidSignatureError } from "../../primitives/errors/CryptoError.js";
import { InvalidPublicKeyError as BaseInvalidPublicKeyError } from "../../primitives/errors/CryptoError.js";
import { InvalidPrivateKeyError as BaseInvalidPrivateKeyError } from "../../primitives/errors/CryptoError.js";
//# sourceMappingURL=errors.d.ts.map