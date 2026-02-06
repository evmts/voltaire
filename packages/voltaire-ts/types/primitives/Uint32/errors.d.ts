import { IntegerOverflowError, IntegerUnderflowError, InvalidFormatError, InvalidLengthError, InvalidRangeError } from "../errors/index.js";
/**
 * Error thrown when Uint32 value is negative
 */
export declare class Uint32NegativeError extends IntegerUnderflowError {
    constructor(message: string, options: {
        code?: number;
        value: bigint | number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Error thrown when Uint32 value exceeds maximum (4294967295)
 */
export declare class Uint32OverflowError extends IntegerOverflowError {
    constructor(message: string, options: {
        code?: number;
        value: bigint | number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Error thrown when Uint32 byte length is invalid
 */
export declare class Uint32InvalidLengthError extends InvalidLengthError {
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
export declare class Uint32DivisionByZeroError extends InvalidRangeError {
    constructor(message?: string, options?: {
        code?: number;
        dividend?: number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Error thrown when Uint32 value is not an integer
 */
export declare class Uint32NotIntegerError extends InvalidFormatError {
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
export declare class Uint32InvalidHexError extends InvalidFormatError {
    constructor(message: string, options: {
        code?: number;
        value: unknown;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
/**
 * Error thrown when value is not a safe integer
 */
export declare class Uint32NotSafeIntegerError extends InvalidFormatError {
    constructor(message: string, options: {
        code?: number;
        value: unknown;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
//# sourceMappingURL=errors.d.ts.map