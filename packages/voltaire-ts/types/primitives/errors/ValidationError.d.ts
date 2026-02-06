import { PrimitiveError } from "./PrimitiveError.js";
/**
 * Base validation error
 *
 * @example
 * ```typescript
 * throw new ValidationError('Invalid value', {
 *   value: '0x123',
 *   expected: '20 bytes',
 *   code: 'VALIDATION_ERROR',
 *   docsPath: '/primitives/address/from-hex#error-handling',
 *   cause: originalError
 * })
 * ```
 */
export declare class ValidationError extends PrimitiveError {
    readonly _tag: string;
    value: unknown;
    expected: string;
    constructor(message: string, options: {
        code?: number | string;
        value: unknown;
        expected: string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Invalid format error (e.g., wrong hex prefix, invalid characters)
 *
 * @throws {InvalidFormatError}
 */
export declare class InvalidFormatError extends ValidationError {
    readonly _tag: string;
    constructor(message: string, options: {
        code?: number | string;
        value: unknown;
        expected: string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Invalid length error (e.g., wrong byte count)
 *
 * @throws {InvalidLengthError}
 */
export declare class InvalidLengthError extends ValidationError {
    readonly _tag: string;
    constructor(message: string, options: {
        code?: number | string;
        value: unknown;
        expected: string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Invalid range error (e.g., value out of bounds)
 *
 * @throws {InvalidRangeError}
 */
export declare class InvalidRangeError extends ValidationError {
    readonly _tag: string;
    constructor(message: string, options: {
        code?: number | string;
        value: unknown;
        expected: string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Invalid checksum error (e.g., EIP-55 checksum mismatch)
 *
 * @throws {InvalidChecksumError}
 */
export declare class InvalidChecksumError extends ValidationError {
    readonly _tag: string;
    constructor(message: string, options: {
        code?: number | string;
        value: unknown;
        expected: string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
//# sourceMappingURL=ValidationError.d.ts.map