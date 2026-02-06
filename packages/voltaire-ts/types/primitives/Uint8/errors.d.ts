import { IntegerOverflowError, IntegerUnderflowError, InvalidFormatError, InvalidLengthError, InvalidRangeError } from "../errors/index.js";
/**
 * Error thrown when Uint8 value is negative
 *
 * @example
 * ```typescript
 * throw new Uint8NegativeError("Uint8 value cannot be negative", { value: -1 });
 * ```
 */
export declare class Uint8NegativeError extends IntegerUnderflowError {
    constructor(message: string, options: {
        code?: number;
        value: bigint | number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Error thrown when Uint8 value exceeds maximum (255)
 *
 * @example
 * ```typescript
 * throw new Uint8OverflowError("Uint8 overflow", { value: 256 });
 * ```
 */
export declare class Uint8OverflowError extends IntegerOverflowError {
    constructor(message: string, options: {
        code?: number;
        value: bigint | number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Error thrown when Uint8 subtraction would underflow
 *
 * @example
 * ```typescript
 * throw new Uint8UnderflowError("Uint8 underflow: 5 - 10", { a: 5, b: 10 });
 * ```
 */
export declare class Uint8UnderflowError extends IntegerUnderflowError {
    constructor(message: string, options: {
        code?: number;
        a: number;
        b: number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Error thrown when Uint8 byte length is invalid
 *
 * @example
 * ```typescript
 * throw new Uint8InvalidLengthError("Uint8 requires exactly 1 byte", {
 *   value: bytes,
 *   expected: "1 byte",
 *   actualLength: 2,
 * });
 * ```
 */
export declare class Uint8InvalidLengthError extends InvalidLengthError {
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
 * Error thrown when division or modulo by zero
 *
 * @example
 * ```typescript
 * throw new Uint8DivisionByZeroError("Division by zero");
 * ```
 */
export declare class Uint8DivisionByZeroError extends InvalidRangeError {
    constructor(message?: string, options?: {
        code?: number;
        dividend?: number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Error thrown when Uint8 value is not an integer
 *
 * @example
 * ```typescript
 * throw new Uint8NotIntegerError("Uint8 value must be an integer", { value: 1.5 });
 * ```
 */
export declare class Uint8NotIntegerError extends InvalidFormatError {
    constructor(message: string, options: {
        code?: number;
        value: unknown;
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
 * throw new Uint8InvalidHexError("Invalid hex string", { value: "0xGGG" });
 * ```
 */
export declare class Uint8InvalidHexError extends InvalidFormatError {
    constructor(message: string, options: {
        code?: number;
        value: unknown;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
//# sourceMappingURL=errors.d.ts.map