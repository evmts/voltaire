import { PrimitiveError } from "./PrimitiveError.js";
/**
 * Base validation error
 *
 * @example
 * ```typescript
 * throw new ValidationError('Invalid value', {
 *   value: '0x123',
 *   expected: '20 bytes',
 *   code: 'VALIDATION_ERROR',
 *   docsPath: '/primitives/address/from-hex#error-handling',
 *   cause: originalError
 * })
 * ```
 */
export class ValidationError extends PrimitiveError {
    _tag = "ValidationError";
    value;
    expected;
    constructor(message, options) {
        super(message, {
            code: options.code,
            context: options.context,
            docsPath: options.docsPath,
            cause: options.cause,
        });
        this.name = "ValidationError";
        this.value = options.value;
        this.expected = options.expected;
    }
}
/**
 * Invalid format error (e.g., wrong hex prefix, invalid characters)
 *
 * @throws {InvalidFormatError}
 */
export class InvalidFormatError extends ValidationError {
    _tag = "InvalidFormatError";
    constructor(message, options) {
        super(message, { ...options, code: options.code });
        this.name = "InvalidFormatError";
    }
}
/**
 * Invalid length error (e.g., wrong byte count)
 *
 * @throws {InvalidLengthError}
 */
export class InvalidLengthError extends ValidationError {
    _tag = "InvalidLengthError";
    constructor(message, options) {
        super(message, { ...options, code: options.code });
        this.name = "InvalidLengthError";
    }
}
/**
 * Invalid range error (e.g., value out of bounds)
 *
 * @throws {InvalidRangeError}
 */
export class InvalidRangeError extends ValidationError {
    _tag = "InvalidRangeError";
    constructor(message, options) {
        super(message, { ...options, code: options.code });
        this.name = "InvalidRangeError";
    }
}
/**
 * Invalid checksum error (e.g., EIP-55 checksum mismatch)
 *
 * @throws {InvalidChecksumError}
 */
export class InvalidChecksumError extends ValidationError {
    _tag = "InvalidChecksumError";
    constructor(message, options) {
        super(message, { ...options, code: options.code });
        this.name = "InvalidChecksumError";
    }
}
