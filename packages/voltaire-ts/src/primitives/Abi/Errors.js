// @ts-check

import {
	DecodingError,
	EncodingError,
	InvalidFormatError,
	InvalidLengthError,
} from "../errors/index.js";

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
	/**
	 * @param {string} message
	 * @param {{
	 *   code?: number | string;
	 *   context?: Record<string, unknown>;
	 *   docsPath?: string;
	 *   cause?: Error;
	 * }=} options
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code ?? -32602,
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/abi",
			cause: options?.cause,
		});
		this.name = "AbiEncodingError";
	}
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
	/**
	 * @param {string} message
	 * @param {{
	 *   code?: number | string;
	 *   context?: Record<string, unknown>;
	 *   docsPath?: string;
	 *   cause?: Error;
	 * }=} options
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code ?? -32602,
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/abi",
			cause: options?.cause,
		});
		this.name = "AbiDecodingError";
	}
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
	/**
	 * @param {string} message
	 * @param {{
	 *   code?: number | string;
	 *   value: unknown;
	 *   expected: string;
	 *   context?: Record<string, unknown>;
	 *   docsPath?: string;
	 *   cause?: Error;
	 * }} options
	 */
	constructor(message, options) {
		super(message, {
			code: options.code ?? -32602,
			value: options.value,
			expected: options.expected,
			context: options.context,
			docsPath: options.docsPath || "/primitives/abi",
			cause: options.cause,
		});
		this.name = "AbiParameterMismatchError";
	}
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
	/**
	 * @param {string} message
	 * @param {{
	 *   code?: number | string;
	 *   value: unknown;
	 *   expected: string;
	 *   context?: Record<string, unknown>;
	 *   docsPath?: string;
	 *   cause?: Error;
	 * }} options
	 */
	constructor(message, options) {
		super(message, {
			code: options.code ?? -32602,
			value: options.value,
			expected: options.expected,
			context: options.context,
			docsPath: options.docsPath || "/primitives/abi",
			cause: options.cause,
		});
		this.name = "AbiItemNotFoundError";
	}
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
	/**
	 * @param {string} message
	 * @param {{
	 *   code?: number | string;
	 *   value: unknown;
	 *   expected: string;
	 *   context?: Record<string, unknown>;
	 *   docsPath?: string;
	 *   cause?: Error;
	 * }} options
	 */
	constructor(message, options) {
		super(message, {
			code: options.code ?? -32602,
			value: options.value,
			expected: options.expected,
			context: options.context,
			docsPath: options.docsPath || "/primitives/abi",
			cause: options.cause,
		});
		this.name = "AbiInvalidSelectorError";
	}
}
