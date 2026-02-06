import { InvalidFormatError, InvalidLengthError, ValidationError } from "../errors/index.js";
/**
 * Error thrown when calldata is too short (must be at least 4 bytes for selector)
 *
 * @example
 * ```typescript
 * throw new InvalidCallDataLengthError('CallData too short', {
 *   value: '0x1234',
 *   expected: 'at least 4 bytes'
 * })
 * ```
 */
export declare class InvalidCallDataLengthError extends InvalidLengthError {
    constructor(message: string, options?: {
        code?: number | string;
        value?: unknown;
        expected?: string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Error thrown when hex string format is invalid
 *
 * @example
 * ```typescript
 * throw new InvalidHexFormatError('Invalid hex characters', {
 *   value: '0xZZZZ',
 *   expected: 'valid hex string'
 * })
 * ```
 */
export declare class InvalidHexFormatError extends InvalidFormatError {
    constructor(message: string, options?: {
        code?: number | string;
        value?: unknown;
        expected?: string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Error thrown when value type is unsupported
 *
 * @example
 * ```typescript
 * throw new InvalidValueError('Unsupported value type', {
 *   value: 123,
 *   expected: 'Uint8Array or hex string'
 * })
 * ```
 */
export declare class InvalidValueError extends ValidationError {
    constructor(message: string, options?: {
        code?: number | string;
        value?: unknown;
        expected?: string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Error thrown when ABI function is not found
 *
 * @example
 * ```typescript
 * throw new AbiItemNotFoundError('Function not found', {
 *   value: '0x12345678',
 *   expected: 'function selector in ABI'
 * })
 * ```
 */
export declare class AbiItemNotFoundError extends InvalidFormatError {
    constructor(message: string, options?: {
        code?: number | string;
        value?: unknown;
        expected?: string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Error thrown when function signature is invalid
 *
 * @example
 * ```typescript
 * throw new InvalidSignatureError('Invalid signature format', {
 *   value: 'invalid',
 *   expected: 'function(type1,type2)'
 * })
 * ```
 */
export declare class InvalidSignatureError extends InvalidFormatError {
    constructor(message: string, options?: {
        code?: number | string;
        value?: unknown;
        expected?: string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Error thrown when parameter count doesn't match signature
 *
 * @example
 * ```typescript
 * throw new ParameterCountMismatchError('Parameter count mismatch', {
 *   value: 1,
 *   expected: '2 parameters'
 * })
 * ```
 */
export declare class ParameterCountMismatchError extends InvalidLengthError {
    constructor(message: string, options?: {
        code?: number | string;
        value?: unknown;
        expected?: string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
//# sourceMappingURL=errors.d.ts.map