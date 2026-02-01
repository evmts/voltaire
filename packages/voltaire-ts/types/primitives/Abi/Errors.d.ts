/**
 * ABI encoding error
 *
 * @example
 * ```typescript
 * throw new AbiEncodingError('Failed to encode parameters', {
 *   context: { types, values },
 *   docsPath: '/primitives/abi/encoding#error-handling',
 *   cause: originalError
 * })
 * ```
 */
export class AbiEncodingError extends EncodingError {
}
/**
 * ABI decoding error
 *
 * @example
 * ```typescript
 * throw new AbiDecodingError('Failed to decode parameters', {
 *   context: { data, types },
 *   docsPath: '/primitives/abi/decoding#error-handling',
 *   cause: originalError
 * })
 * ```
 */
export class AbiDecodingError extends DecodingError {
}
/**
 * ABI parameter mismatch error (wrong number/types of parameters)
 *
 * @example
 * ```typescript
 * throw new AbiParameterMismatchError('Parameter count mismatch', {
 *   value: actualCount,
 *   expected: `${expectedCount} parameters`,
 *   context: { types, values }
 * })
 * ```
 */
export class AbiParameterMismatchError extends InvalidLengthError {
}
/**
 * ABI item not found error (function/event/error not in ABI)
 *
 * @example
 * ```typescript
 * throw new AbiItemNotFoundError('Function not found', {
 *   value: selector,
 *   expected: 'valid function selector in ABI',
 *   context: { selector, abi }
 * })
 * ```
 */
export class AbiItemNotFoundError extends InvalidFormatError {
}
/**
 * ABI invalid selector error (selector mismatch)
 *
 * @example
 * ```typescript
 * throw new AbiInvalidSelectorError('Selector mismatch', {
 *   value: actualSelector,
 *   expected: expectedSelector,
 *   context: { item }
 * })
 * ```
 */
export class AbiInvalidSelectorError extends InvalidFormatError {
}
import { EncodingError } from "../errors/index.js";
import { DecodingError } from "../errors/index.js";
import { InvalidLengthError } from "../errors/index.js";
import { InvalidFormatError } from "../errors/index.js";
//# sourceMappingURL=Errors.d.ts.map