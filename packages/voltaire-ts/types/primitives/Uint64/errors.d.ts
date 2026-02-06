import { IntegerOverflowError, IntegerUnderflowError, InvalidFormatError, InvalidLengthError, InvalidRangeError } from "../errors/index.js";
/**
 * Error thrown when Uint64 value is negative
 */
export declare class Uint64NegativeError extends IntegerUnderflowError {
    constructor(message: string, options: {
        code?: number;
        value: bigint | number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Error thrown when Uint64 value exceeds maximum (2^64 - 1)
 */
export declare class Uint64OverflowError extends IntegerOverflowError {
    constructor(message: string, options: {
        code?: number;
        value: bigint | number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Error thrown when Uint64 byte length is invalid
 */
export declare class Uint64InvalidLengthError extends InvalidLengthError {
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
 */
export declare class Uint64DivisionByZeroError extends InvalidRangeError {
    constructor(message?: string, options?: {
        code?: number;
        dividend?: bigint;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Error thrown when Uint64 value is not an integer
 */
export declare class Uint64NotIntegerError extends InvalidFormatError {
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
 */
export declare class Uint64InvalidHexError extends InvalidFormatError {
    constructor(message: string, options: {
        code?: number;
        value: unknown;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
//# sourceMappingURL=errors.d.ts.map