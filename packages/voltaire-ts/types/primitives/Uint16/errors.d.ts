import { IntegerOverflowError, IntegerUnderflowError, InvalidFormatError, InvalidLengthError, InvalidRangeError } from "../errors/index.js";
/**
 * Error thrown when Uint16 value is negative
 */
export declare class Uint16NegativeError extends IntegerUnderflowError {
    constructor(message: string, options: {
        code?: number;
        value: bigint | number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Error thrown when Uint16 value exceeds maximum (65535)
 */
export declare class Uint16OverflowError extends IntegerOverflowError {
    constructor(message: string, options: {
        code?: number;
        value: bigint | number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Error thrown when Uint16 subtraction would underflow
 */
export declare class Uint16UnderflowError extends IntegerUnderflowError {
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
 * Error thrown when Uint16 byte length is invalid
 */
export declare class Uint16InvalidLengthError extends InvalidLengthError {
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
export declare class Uint16DivisionByZeroError extends InvalidRangeError {
    constructor(message?: string, options?: {
        code?: number;
        dividend?: number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Error thrown when Uint16 value is not an integer
 */
export declare class Uint16NotIntegerError extends InvalidFormatError {
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
export declare class Uint16InvalidHexError extends InvalidFormatError {
    constructor(message: string, options: {
        code?: number;
        value: unknown;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
//# sourceMappingURL=errors.d.ts.map