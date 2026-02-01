import { InvalidFormatError as BaseInvalidFormatError, InvalidLengthError as BaseInvalidLengthError, InvalidRangeError as BaseInvalidRangeError } from "../errors/index.js";
interface ErrorOptions {
    code?: number;
    value?: unknown;
    expected?: string;
    context?: Record<string, unknown>;
    docsPath?: string;
    cause?: Error;
}
/**
 * Error for invalid hex format (missing 0x prefix)
 */
export declare class InvalidFormatError extends BaseInvalidFormatError {
    constructor(message?: string, options?: ErrorOptions);
}
/**
 * Error for invalid hex length
 */
export declare class InvalidLengthError extends BaseInvalidLengthError {
    constructor(message?: string, options?: ErrorOptions);
}
/**
 * Error for invalid hex character
 */
export declare class InvalidCharacterError extends BaseInvalidFormatError {
    constructor(message?: string, options?: ErrorOptions);
}
/**
 * Error for odd length hex string
 */
export declare class OddLengthError extends BaseInvalidLengthError {
    constructor(message?: string, options?: ErrorOptions);
}
/**
 * Error for hex size exceeding target size
 */
export declare class SizeExceededError extends BaseInvalidLengthError {
    constructor(message?: string, options?: ErrorOptions);
}
/**
 * Error for invalid boolean hex value
 */
export declare class InvalidBooleanHexError extends BaseInvalidRangeError {
    constructor(message?: string, options?: ErrorOptions);
}
/**
 * Error for negative number in hex conversion
 */
export declare class NegativeNumberError extends BaseInvalidRangeError {
    constructor(message?: string, options?: ErrorOptions);
}
/**
 * Error for number exceeding MAX_SAFE_INTEGER
 */
export declare class UnsafeIntegerError extends BaseInvalidRangeError {
    constructor(message?: string, options?: ErrorOptions);
}
/**
 * Error for non-integer number
 */
export declare class NonIntegerError extends BaseInvalidRangeError {
    constructor(message?: string, options?: ErrorOptions);
}
/**
 * Error for invalid size parameter
 */
export declare class InvalidSizeError extends BaseInvalidRangeError {
    constructor(message?: string, options?: ErrorOptions);
}
export declare const InvalidHexFormatError: typeof InvalidFormatError;
export declare const InvalidHexCharacterError: typeof InvalidCharacterError;
export declare const OddLengthHexError: typeof OddLengthError;
export declare const InvalidHexLengthError: typeof InvalidLengthError;
export {};
//# sourceMappingURL=errors.d.ts.map