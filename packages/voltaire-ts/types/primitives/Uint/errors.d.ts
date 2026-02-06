import { IntegerOverflowError, IntegerUnderflowError, InvalidFormatError, InvalidLengthError, InvalidRangeError, ValidationError } from "../errors/index.js";
/**
 * Error thrown when Uint value is negative
 *
 * @example
 * ```typescript
 * throw new UintNegativeError("Uint256 value cannot be negative", {
 *   value: -1n,
 * });
 * ```
 */
export declare class UintNegativeError extends IntegerUnderflowError {
    constructor(message: string, options: {
        code?: number;
        value: bigint | number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Error thrown when Uint value exceeds maximum
 *
 * @example
 * ```typescript
 * throw new UintOverflowError("Uint256 value exceeds maximum", {
 *   value: 2n ** 256n,
 *   max: 2n ** 256n - 1n,
 * });
 * ```
 */
export declare class UintOverflowError extends IntegerOverflowError {
    constructor(message: string, options: {
        code?: number;
        value: bigint | number;
        max?: bigint | number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Error thrown when Uint byte length is invalid
 *
 * @example
 * ```typescript
 * throw new UintInvalidLengthError("Uint256 bytes cannot exceed 32 bytes", {
 *   value: bytes,
 *   expected: "<= 32 bytes",
 *   actualLength: 40,
 * });
 * ```
 */
export declare class UintInvalidLengthError extends InvalidLengthError {
    constructor(message: string, options: {
        code?: number;
        value: unknown;
        expected: string;
        actualLength?: number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Error thrown when Uint operation requires at least one value
 *
 * @example
 * ```typescript
 * throw new UintEmptyInputError("min requires at least one value");
 * ```
 */
export declare class UintEmptyInputError extends ValidationError {
    constructor(message: string, options?: {
        code?: number;
        value?: unknown;
        expected?: string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Error thrown when division or modulo by zero
 *
 * @example
 * ```typescript
 * throw new UintDivisionByZeroError("Division by zero");
 * ```
 */
export declare class UintDivisionByZeroError extends InvalidRangeError {
    constructor(message?: string, options?: {
        code?: number;
        dividend?: bigint | number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Error thrown when Uint value is not an integer
 *
 * @example
 * ```typescript
 * throw new UintNotIntegerError("Uint256 value must be an integer", {
 *   value: 1.5,
 * });
 * ```
 */
export declare class UintNotIntegerError extends InvalidFormatError {
    constructor(message: string, options: {
        code?: number;
        value: unknown;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Error thrown when value exceeds safe integer range for number conversion
 *
 * @example
 * ```typescript
 * throw new UintSafeIntegerOverflowError("Value exceeds MAX_SAFE_INTEGER", {
 *   value: 2n ** 53n,
 * });
 * ```
 */
export declare class UintSafeIntegerOverflowError extends IntegerOverflowError {
    constructor(message: string, options: {
        code?: number;
        value: bigint | number;
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
 * throw new UintInvalidHexError("Invalid hex string", {
 *   value: "0xGGG",
 * });
 * ```
 */
export declare class UintInvalidHexError extends InvalidFormatError {
    constructor(message: string, options: {
        code?: number;
        value: unknown;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
//# sourceMappingURL=errors.d.ts.map