/**
 * Base EIP-712 error
 *
 * @example
 * ```javascript
 * throw new Eip712Error('EIP-712 operation failed', {
 *   code: -32000,
 *   context: { operation: 'sign' },
 *   docsPath: '/crypto/eip712#error-handling',
 *   cause: originalError
 * })
 * ```
 */
export class Eip712Error extends CryptoError {
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
 * EIP-712 encoding error
 *
 * @example
 * ```javascript
 * throw new Eip712EncodingError('Failed to encode value', {
 *   code: -32001,
 *   context: { type: 'address', value: '0x...' },
 *   docsPath: '/crypto/eip712/encode-value#error-handling',
 *   cause: originalError
 * })
 * ```
 */
export class Eip712EncodingError extends Eip712Error {
    /** @override @readonly */
    override readonly _tag: "Eip712EncodingError";
}
/**
 * EIP-712 type not found error
 *
 * @example
 * ```javascript
 * throw new Eip712TypeNotFoundError('Type Person not found', {
 *   code: -32002,
 *   context: { type: 'Person' },
 *   docsPath: '/crypto/eip712/encode-type#error-handling',
 *   cause: originalError
 * })
 * ```
 */
export class Eip712TypeNotFoundError extends Eip712Error {
    /** @override @readonly */
    override readonly _tag: "Eip712TypeNotFoundError";
}
/**
 * EIP-712 invalid message error
 *
 * @example
 * ```javascript
 * throw new Eip712InvalidMessageError('Missing required field', {
 *   code: -32003,
 *   context: { field: 'name' },
 *   docsPath: '/crypto/eip712/encode-data#error-handling',
 *   cause: originalError
 * })
 * ```
 */
export class Eip712InvalidMessageError extends Eip712Error {
    /** @override @readonly */
    override readonly _tag: "Eip712InvalidMessageError";
}
/**
 * EIP-712 invalid domain error
 *
 * Thrown when domain fields have incorrect types or values.
 *
 * @example
 * ```javascript
 * throw new Eip712InvalidDomainError('Invalid domain field: name must be a string', {
 *   code: -32004,
 *   context: { field: 'name', value: 123 },
 *   docsPath: '/crypto/eip712/domain#error-handling',
 * })
 * ```
 */
export class Eip712InvalidDomainError extends Eip712Error {
    /** @override @readonly */
    override readonly _tag: "Eip712InvalidDomainError";
}
import { CryptoError } from "../../primitives/errors/CryptoError.js";
//# sourceMappingURL=errors.d.ts.map