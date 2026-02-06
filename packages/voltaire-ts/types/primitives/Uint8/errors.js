import { IntegerOverflowError, IntegerUnderflowError, InvalidFormatError, InvalidLengthError, InvalidRangeError, } from "../errors/index.js";
const MAX = 255;
const TYPE_NAME = "Uint8";
/**
 * Error thrown when Uint8 value is negative
 *
 * @example
 * ```typescript
 * throw new Uint8NegativeError("Uint8 value cannot be negative", { value: -1 });
 * ```
 */
export class Uint8NegativeError extends IntegerUnderflowError {
    constructor(message, options) {
        super(message, {
            code: options.code ?? -32602,
            value: options.value,
            min: 0,
            type: TYPE_NAME,
            context: options.context,
            docsPath: options.docsPath || "/primitives/uint8#error-handling",
            cause: options.cause,
        });
        this.name = "Uint8NegativeError";
    }
}
/**
 * Error thrown when Uint8 value exceeds maximum (255)
 *
 * @example
 * ```typescript
 * throw new Uint8OverflowError("Uint8 overflow", { value: 256 });
 * ```
 */
export class Uint8OverflowError extends IntegerOverflowError {
    constructor(message, options) {
        super(message, {
            code: options.code ?? -32602,
            value: options.value,
            max: MAX,
            type: TYPE_NAME,
            context: options.context,
            docsPath: options.docsPath || "/primitives/uint8#error-handling",
            cause: options.cause,
        });
        this.name = "Uint8OverflowError";
    }
}
/**
 * Error thrown when Uint8 subtraction would underflow
 *
 * @example
 * ```typescript
 * throw new Uint8UnderflowError("Uint8 underflow: 5 - 10", { a: 5, b: 10 });
 * ```
 */
export class Uint8UnderflowError extends IntegerUnderflowError {
    constructor(message, options) {
        super(message, {
            code: options.code ?? -32602,
            value: options.a - options.b,
            min: 0,
            type: TYPE_NAME,
            context: { ...options.context, a: options.a, b: options.b },
            docsPath: options.docsPath || "/primitives/uint8#error-handling",
            cause: options.cause,
        });
        this.name = "Uint8UnderflowError";
    }
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
export class Uint8InvalidLengthError extends InvalidLengthError {
    constructor(message, options) {
        super(message, {
            code: options.code ?? -32602,
            value: options.value,
            expected: options.expected,
            context: { ...options.context, actualLength: options.actualLength },
            docsPath: options.docsPath || "/primitives/uint8#error-handling",
            cause: options.cause,
        });
        this.name = "Uint8InvalidLengthError";
    }
}
/**
 * Error thrown when division or modulo by zero
 *
 * @example
 * ```typescript
 * throw new Uint8DivisionByZeroError("Division by zero");
 * ```
 */
export class Uint8DivisionByZeroError extends InvalidRangeError {
    constructor(message, options) {
        super(message || "Division by zero", {
            code: options?.code ?? -32000,
            value: options?.dividend ?? 0,
            expected: "Non-zero divisor",
            context: options?.context,
            docsPath: options?.docsPath || "/primitives/uint8#error-handling",
            cause: options?.cause,
        });
        this.name = "Uint8DivisionByZeroError";
    }
}
/**
 * Error thrown when Uint8 value is not an integer
 *
 * @example
 * ```typescript
 * throw new Uint8NotIntegerError("Uint8 value must be an integer", { value: 1.5 });
 * ```
 */
export class Uint8NotIntegerError extends InvalidFormatError {
    constructor(message, options) {
        super(message, {
            code: options.code ?? -32602,
            value: options.value,
            expected: "Integer value",
            context: options.context,
            docsPath: options.docsPath || "/primitives/uint8#error-handling",
            cause: options.cause,
        });
        this.name = "Uint8NotIntegerError";
    }
}
/**
 * Error thrown when hex string format is invalid
 *
 * @example
 * ```typescript
 * throw new Uint8InvalidHexError("Invalid hex string", { value: "0xGGG" });
 * ```
 */
export class Uint8InvalidHexError extends InvalidFormatError {
    constructor(message, options) {
        super(message, {
            code: options.code ?? -32602,
            value: options.value,
            expected: "Valid hex string (0x...)",
            context: options.context,
            docsPath: options.docsPath || "/primitives/uint8#error-handling",
            cause: options.cause,
        });
        this.name = "Uint8InvalidHexError";
    }
}
