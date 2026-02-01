import { IntegerOverflowError, IntegerUnderflowError, InvalidFormatError, InvalidLengthError, InvalidRangeError, } from "../errors/index.js";
const MAX = 0xffffffffffffffffn;
const TYPE_NAME = "Uint64";
/**
 * Error thrown when Uint64 value is negative
 */
export class Uint64NegativeError extends IntegerUnderflowError {
    constructor(message, options) {
        super(message, {
            code: options.code ?? -32602,
            value: options.value,
            min: 0n,
            type: TYPE_NAME,
            context: options.context,
            docsPath: options.docsPath || "/primitives/uint64#error-handling",
            cause: options.cause,
        });
        this.name = "Uint64NegativeError";
    }
}
/**
 * Error thrown when Uint64 value exceeds maximum (2^64 - 1)
 */
export class Uint64OverflowError extends IntegerOverflowError {
    constructor(message, options) {
        super(message, {
            code: options.code ?? -32602,
            value: options.value,
            max: MAX,
            type: TYPE_NAME,
            context: options.context,
            docsPath: options.docsPath || "/primitives/uint64#error-handling",
            cause: options.cause,
        });
        this.name = "Uint64OverflowError";
    }
}
/**
 * Error thrown when Uint64 byte length is invalid
 */
export class Uint64InvalidLengthError extends InvalidLengthError {
    constructor(message, options) {
        super(message, {
            code: options.code ?? -32602,
            value: options.value,
            expected: options.expected,
            context: { ...options.context, actualLength: options.actualLength },
            docsPath: options.docsPath || "/primitives/uint64#error-handling",
            cause: options.cause,
        });
        this.name = "Uint64InvalidLengthError";
    }
}
/**
 * Error thrown when division or modulo by zero
 */
export class Uint64DivisionByZeroError extends InvalidRangeError {
    constructor(message, options) {
        super(message || "Division by zero", {
            code: options?.code ?? -32000,
            value: options?.dividend ?? 0n,
            expected: "Non-zero divisor",
            context: options?.context,
            docsPath: options?.docsPath || "/primitives/uint64#error-handling",
            cause: options?.cause,
        });
        this.name = "Uint64DivisionByZeroError";
    }
}
/**
 * Error thrown when Uint64 value is not an integer
 */
export class Uint64NotIntegerError extends InvalidFormatError {
    constructor(message, options) {
        super(message, {
            code: options.code ?? -32602,
            value: options.value,
            expected: "Integer value",
            context: options.context,
            docsPath: options.docsPath || "/primitives/uint64#error-handling",
            cause: options.cause,
        });
        this.name = "Uint64NotIntegerError";
    }
}
/**
 * Error thrown when hex string format is invalid
 */
export class Uint64InvalidHexError extends InvalidFormatError {
    constructor(message, options) {
        super(message, {
            code: options.code ?? -32602,
            value: options.value,
            expected: "Valid hex string (0x...)",
            context: options.context,
            docsPath: options.docsPath || "/primitives/uint64#error-handling",
            cause: options.cause,
        });
        this.name = "Uint64InvalidHexError";
    }
}
