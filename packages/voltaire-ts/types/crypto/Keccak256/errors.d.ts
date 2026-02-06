/**
 * Keccak256 Error Types
 *
 * @see https://voltaire.tevm.sh/crypto/keccak256 for Keccak256 documentation
 * @since 0.0.0
 */
/**
 * Base error for Keccak256 operations
 *
 * @since 0.0.0
 * @example
 * ```javascript
 * import { Keccak256Error } from './crypto/Keccak256/errors.js';
 * throw new Keccak256Error('Hashing failed', {
 *   code: 'KECCAK256_ERROR',
 *   context: { operation: 'hash' },
 *   docsPath: '/crypto/keccak256#error-handling'
 * });
 * ```
 */
export class Keccak256Error extends CryptoError {
    /**
     * @param {string} message - Error message
     * @param {Object} [options] - Error options
     * @param {number} [options.code] - Error code
     * @param {Record<string, unknown>} [options.context] - Additional context
     * @param {string} [options.docsPath] - Documentation path
     * @param {Error} [options.cause] - Underlying error
     */
    constructor(message: string, options?: {
        code?: number | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
}
/**
 * Error for native library not loaded
 *
 * @since 0.0.0
 * @example
 * ```javascript
 * import { Keccak256NativeNotLoadedError } from './crypto/Keccak256/errors.js';
 * throw new Keccak256NativeNotLoadedError('Native library not loaded', {
 *   context: { operation: 'hashSync' },
 *   docsPath: '/crypto/keccak256#native-loading'
 * });
 * ```
 */
export class Keccak256NativeNotLoadedError extends Keccak256Error {
    /**
     * @param {string} [message] - Error message
     * @param {Object} [options] - Error options
     * @param {number} [options.code] - Error code
     * @param {Record<string, unknown>} [options.context] - Additional context
     * @param {string} [options.docsPath] - Documentation path
     * @param {Error} [options.cause] - Underlying error
     */
    constructor(message?: string, options?: {
        code?: number | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
    /** @override @readonly */
    override readonly _tag: "Keccak256NativeNotLoadedError";
}
import { CryptoError } from "../../primitives/errors/CryptoError.js";
//# sourceMappingURL=errors.d.ts.map