import { AbiEncodingError, AbiDecodingError, AbiInvalidSelectorError } from '../../Errors.js';

/**
 * Error thrown when encoding function data fails
 */
export class FunctionEncodingError extends AbiEncodingError {
	/**
	 * @param {string} message - Error message
	 * @param {object} [options] - Error options
	 * @param {string} [options.code] - Error code
	 * @param {Record<string, unknown>} [options.context] - Additional context
	 * @param {string} [options.docsPath] - Documentation path
	 * @param {Error} [options.cause] - Original error
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || 'FUNCTION_ENCODING_ERROR',
			context: options?.context,
			docsPath: options?.docsPath || '/primitives/abi/function',
			cause: options?.cause,
		});
		this.name = 'FunctionEncodingError';
	}
}

/**
 * Error thrown when decoding function data fails
 */
export class FunctionDecodingError extends AbiDecodingError {
	/**
	 * @param {string} message - Error message
	 * @param {object} [options] - Error options
	 * @param {string} [options.code] - Error code
	 * @param {Record<string, unknown>} [options.context] - Additional context
	 * @param {string} [options.docsPath] - Documentation path
	 * @param {Error} [options.cause] - Original error
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || 'FUNCTION_DECODING_ERROR',
			context: options?.context,
			docsPath: options?.docsPath || '/primitives/abi/function',
			cause: options?.cause,
		});
		this.name = 'FunctionDecodingError';
	}
}

/**
 * Error thrown when function selector doesn't match
 */
export class FunctionInvalidSelectorError extends AbiInvalidSelectorError {
	/**
	 * @param {string} [message] - Error message
	 * @param {object} [options] - Error options
	 * @param {string} [options.code] - Error code
	 * @param {unknown} [options.value] - Actual selector value
	 * @param {string} [options.expected] - Expected selector value
	 * @param {Record<string, unknown>} [options.context] - Additional context
	 * @param {string} [options.docsPath] - Documentation path
	 * @param {Error} [options.cause] - Original error
	 */
	constructor(message = 'Function selector mismatch', options) {
		super(message, {
			code: options?.code || 'FUNCTION_INVALID_SELECTOR',
			value: options?.value || 'unknown',
			expected: options?.expected || 'valid function selector',
			context: options?.context,
			docsPath: options?.docsPath || '/primitives/abi/function',
			cause: options?.cause,
		});
		this.name = 'FunctionInvalidSelectorError';
	}
}
