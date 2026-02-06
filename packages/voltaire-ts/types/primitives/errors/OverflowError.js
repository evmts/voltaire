import { InvalidRangeError } from "./ValidationError.js";
/**
 * Error thrown when integer value exceeds maximum bound
 *
 * @example
 * ```typescript
 * throw new IntegerOverflowError(
 *   'Value exceeds uint8 maximum',
 *   {
 *     value: 256n,
 *     max: 255n,
 *     type: 'uint8',
 *   }
 * )
 * ```
 */
export class IntegerOverflowError extends InvalidRangeError {
    _tag = "IntegerOverflowError";
    /** Maximum allowed value */
    max;
    /** Integer type (e.g., 'uint8', 'uint256') */
    integerType;
    constructor(message, options) {
        super(message, {
            code: options.code,
            value: options.value,
            expected: `value <= ${options.max}`,
            context: {
                ...options.context,
                max: options.max,
                integerType: options.type,
            },
            docsPath: options.docsPath || "/primitives/validation#integer-overflow-error",
            cause: options.cause,
        });
        this.name = "IntegerOverflowError";
        this.max = options.max;
        this.integerType = options.type;
    }
}
/**
 * Error thrown when integer value is below minimum bound (e.g., negative for unsigned)
 *
 * @example
 * ```typescript
 * throw new IntegerUnderflowError(
 *   'Unsigned integer cannot be negative',
 *   {
 *     value: -1n,
 *     min: 0n,
 *     type: 'uint256',
 *   }
 * )
 * ```
 */
export class IntegerUnderflowError extends InvalidRangeError {
    _tag = "IntegerUnderflowError";
    /** Minimum allowed value */
    min;
    /** Integer type (e.g., 'uint8', 'int256') */
    integerType;
    constructor(message, options) {
        super(message, {
            code: options.code,
            value: options.value,
            expected: `value >= ${options.min}`,
            context: {
                ...options.context,
                min: options.min,
                integerType: options.type,
            },
            docsPath: options.docsPath || "/primitives/validation#integer-underflow-error",
            cause: options.cause,
        });
        this.name = "IntegerUnderflowError";
        this.min = options.min;
        this.integerType = options.type;
    }
}
/**
 * Error thrown when hex/byte data has invalid size
 *
 * @example
 * ```typescript
 * throw new InvalidSizeError(
 *   'Address must be 20 bytes',
 *   {
 *     actualSize: 10,
 *     expectedSize: 20,
 *     value: '0x1234...',
 *   }
 * )
 * ```
 */
export class InvalidSizeError extends InvalidRangeError {
    _tag = "InvalidSizeError";
    /** Actual size in bytes */
    actualSize;
    /** Expected size in bytes */
    expectedSize;
    constructor(message, options) {
        super(message, {
            code: options.code,
            value: options.value,
            expected: `${options.expectedSize} bytes`,
            context: {
                ...options.context,
                actualSize: options.actualSize,
                expectedSize: options.expectedSize,
            },
            docsPath: options.docsPath || "/primitives/validation#invalid-size-error",
            cause: options.cause,
        });
        this.name = "InvalidSizeError";
        this.actualSize = options.actualSize;
        this.expectedSize = options.expectedSize;
    }
}
