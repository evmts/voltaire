import { InvalidFormatError, InvalidLengthError, ValidationError, } from "../errors/index.js";
/**
 * Error thrown when calldata is too short (must be at least 4 bytes for selector)
 *
 * @example
 * ```typescript
 * throw new InvalidCallDataLengthError('CallData too short', {
 *   value: '0x1234',
 *   expected: 'at least 4 bytes'
 * })
 * ```
 */
export class InvalidCallDataLengthError extends InvalidLengthError {
    constructor(message, options) {
        super(message, {
            code: options?.code ?? -32602,
            value: options?.value,
            expected: options?.expected ?? "at least 4 bytes",
            context: options?.context,
            docsPath: options?.docsPath || "/primitives/call-data",
            cause: options?.cause,
        });
        this.name = "InvalidCallDataLengthError";
    }
}
/**
 * Error thrown when hex string format is invalid
 *
 * @example
 * ```typescript
 * throw new InvalidHexFormatError('Invalid hex characters', {
 *   value: '0xZZZZ',
 *   expected: 'valid hex string'
 * })
 * ```
 */
export class InvalidHexFormatError extends InvalidFormatError {
    constructor(message, options) {
        super(message, {
            code: options?.code ?? -32602,
            value: options?.value,
            expected: options?.expected ?? "valid hex string",
            context: options?.context,
            docsPath: options?.docsPath || "/primitives/call-data",
            cause: options?.cause,
        });
        this.name = "InvalidHexFormatError";
    }
}
/**
 * Error thrown when value type is unsupported
 *
 * @example
 * ```typescript
 * throw new InvalidValueError('Unsupported value type', {
 *   value: 123,
 *   expected: 'Uint8Array or hex string'
 * })
 * ```
 */
export class InvalidValueError extends ValidationError {
    constructor(message, options) {
        super(message, {
            code: options?.code ?? -32602,
            value: options?.value,
            expected: options?.expected ?? "valid value",
            context: options?.context,
            docsPath: options?.docsPath || "/primitives/call-data",
            cause: options?.cause,
        });
        this.name = "InvalidValueError";
    }
}
/**
 * Error thrown when ABI function is not found
 *
 * @example
 * ```typescript
 * throw new AbiItemNotFoundError('Function not found', {
 *   value: '0x12345678',
 *   expected: 'function selector in ABI'
 * })
 * ```
 */
export class AbiItemNotFoundError extends InvalidFormatError {
    constructor(message, options) {
        super(message, {
            code: options?.code ?? -32602,
            value: options?.value,
            expected: options?.expected ?? "function in ABI",
            context: options?.context,
            docsPath: options?.docsPath || "/primitives/call-data",
            cause: options?.cause,
        });
        this.name = "AbiItemNotFoundError";
    }
}
/**
 * Error thrown when function signature is invalid
 *
 * @example
 * ```typescript
 * throw new InvalidSignatureError('Invalid signature format', {
 *   value: 'invalid',
 *   expected: 'function(type1,type2)'
 * })
 * ```
 */
export class InvalidSignatureError extends InvalidFormatError {
    constructor(message, options) {
        super(message, {
            code: options?.code ?? -32602,
            value: options?.value,
            expected: options?.expected ?? "valid function signature",
            context: options?.context,
            docsPath: options?.docsPath || "/primitives/call-data",
            cause: options?.cause,
        });
        this.name = "InvalidSignatureError";
    }
}
/**
 * Error thrown when parameter count doesn't match signature
 *
 * @example
 * ```typescript
 * throw new ParameterCountMismatchError('Parameter count mismatch', {
 *   value: 1,
 *   expected: '2 parameters'
 * })
 * ```
 */
export class ParameterCountMismatchError extends InvalidLengthError {
    constructor(message, options) {
        super(message, {
            code: options?.code ?? -32602,
            value: options?.value,
            expected: options?.expected ?? "matching parameter count",
            context: options?.context,
            docsPath: options?.docsPath || "/primitives/call-data",
            cause: options?.cause,
        });
        this.name = "ParameterCountMismatchError";
    }
}
