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
export declare class IntegerOverflowError extends InvalidRangeError {
    readonly _tag: string;
    /** Maximum allowed value */
    max: bigint | number;
    /** Integer type (e.g., 'uint8', 'uint256') */
    integerType: string;
    constructor(message: string, options: {
        code?: number | string;
        value: bigint | number;
        max: bigint | number;
        type: string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
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
export declare class IntegerUnderflowError extends InvalidRangeError {
    readonly _tag: string;
    /** Minimum allowed value */
    min: bigint | number;
    /** Integer type (e.g., 'uint8', 'int256') */
    integerType: string;
    constructor(message: string, options: {
        code?: number | string;
        value: bigint | number;
        min: bigint | number;
        type: string;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
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
export declare class InvalidSizeError extends InvalidRangeError {
    readonly _tag: string;
    /** Actual size in bytes */
    actualSize: number;
    /** Expected size in bytes */
    expectedSize: number;
    constructor(message: string, options: {
        code?: number | string;
        value: unknown;
        actualSize: number;
        expectedSize: number;
        context?: Record<string, unknown>;
        docsPath?: string;
        cause?: Error;
    });
}
//# sourceMappingURL=OverflowError.d.ts.map