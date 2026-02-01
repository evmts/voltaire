import { IntegerOverflowError, IntegerUnderflowError, InvalidFormatError, InvalidLengthError, InvalidRangeError, } from "../errors/index.js";
const MAX = 0xffffffff;
const TYPE_NAME = "Uint32";
/**
 * Error thrown when Uint32 value is negative
 */
export class Uint32NegativeError extends IntegerUnderflowError {
    constructor(message, options) {
        super(message, {
            code: options.code ?? -32602,
            value: options.value,
            min: 0,
            type: TYPE_NAME,
            context: options.context,
            docsPath: options.docsPath || "/primitives/uint32#error-handling",
            cause: options.cause,
        });
        this.name = "Uint32NegativeError";
    }
}
/**
 * Error thrown when Uint32 value exceeds maximum (4294967295)
 */
export class Uint32OverflowError extends IntegerOverflowError {
    constructor(message, options) {
        super(message, {
            code: options.code ?? -32602,
            value: options.value,
            max: MAX,
            type: TYPE_NAME,
            context: options.context,
            docsPath: options.docsPath || "/primitives/uint32#error-handling",
            cause: options.cause,
        });
        this.name = "Uint32OverflowError";
    }
}
/**
 * Error thrown when Uint32 byte length is invalid
 */
export class Uint32InvalidLengthError extends InvalidLengthError {
    constructor(message, options) {
        super(message, {
            code: options.code ?? -32602,
            value: options.value,
            expected: options.expected,
            context: { ...options.context, actualLength: options.actualLength },
            docsPath: options.docsPath || "/primitives/uint32#error-handling",
            cause: options.cause,
        });
        this.name = "Uint32InvalidLengthError";
    }
}
/**
 * Error thrown when division or modulo by zero
 */
export class Uint32DivisionByZeroError extends InvalidRangeError {
    constructor(message, options) {
        super(message || "Division by zero", {
            code: options?.code ?? -32000,
            value: options?.dividend ?? 0,
            expected: "Non-zero divisor",
            context: options?.context,
            docsPath: options?.docsPath || "/primitives/uint32#error-handling",
            cause: options?.cause,
        });
        this.name = "Uint32DivisionByZeroError";
    }
}
/**
 * Error thrown when Uint32 value is not an integer
 */
export class Uint32NotIntegerError extends InvalidFormatError {
    constructor(message, options) {
        super(message, {
            code: options.code ?? -32602,
            value: options.value,
            expected: "Integer value",
            context: options.context,
            docsPath: options.docsPath || "/primitives/uint32#error-handling",
            cause: options.cause,
        });
        this.name = "Uint32NotIntegerError";
    }
}
/**
 * Error thrown when hex string format is invalid
 */
export class Uint32InvalidHexError extends InvalidFormatError {
    constructor(message, options) {
        super(message, {
            code: options.code ?? -32602,
            value: options.value,
            expected: "Valid hex string (0x...)",
            context: options.context,
            docsPath: options.docsPath || "/primitives/uint32#error-handling",
            cause: options.cause,
        });
        this.name = "Uint32InvalidHexError";
    }
}
/**
 * Error thrown when value is not a safe integer
 */
export class Uint32NotSafeIntegerError extends InvalidFormatError {
    constructor(message, options) {
        super(message, {
            code: options.code ?? -32602,
            value: options.value,
            expected: "Safe integer value",
            context: options.context,
            docsPath: options.docsPath || "/primitives/uint32#error-handling",
            cause: options.cause,
        });
        this.name = "Uint32NotSafeIntegerError";
    }
}
