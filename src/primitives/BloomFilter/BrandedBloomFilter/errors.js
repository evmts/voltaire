import { InvalidLengthError, InvalidRangeError } from "../../errors/index.js";

/**
 * Error thrown when BloomFilter parameters are invalid
 *
 * @example
 * ```typescript
 * throw new InvalidBloomFilterParameterError(
 *   'Bloom filter parameters must be positive',
 *   {
 *     value: { m, k },
 *     expected: 'm > 0 and k > 0',
 *     code: 'BLOOM_FILTER_INVALID_PARAMETER',
 *     docsPath: '/primitives/bloom-filter/create#error-handling'
 *   }
 * )
 * ```
 */
export class InvalidBloomFilterParameterError extends InvalidRangeError {
	/**
	 * @param {string} message
	 * @param {object} [options]
	 * @param {string} [options.code]
	 * @param {unknown} [options.value]
	 * @param {string} [options.expected]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "BLOOM_FILTER_INVALID_PARAMETER",
			value: options?.value,
			expected: options?.expected || "valid bloom filter parameters",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/bloom-filter#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidBloomFilterParameterError";
	}
}

/**
 * Error thrown when BloomFilter data length is invalid
 *
 * @example
 * ```typescript
 * throw new InvalidBloomFilterLengthError(
 *   'Expected 512 hex chars, got 256',
 *   {
 *     value: 256,
 *     expected: '512 hex chars',
 *     code: 'BLOOM_FILTER_INVALID_LENGTH',
 *     docsPath: '/primitives/bloom-filter/from-hex#error-handling'
 *   }
 * )
 * ```
 */
export class InvalidBloomFilterLengthError extends InvalidLengthError {
	/**
	 * @param {string} message
	 * @param {object} [options]
	 * @param {string} [options.code]
	 * @param {unknown} [options.value]
	 * @param {string} [options.expected]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message, options) {
		super(message, {
			code: options?.code || "BLOOM_FILTER_INVALID_LENGTH",
			value: options?.value,
			expected: options?.expected || "valid bloom filter length",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/bloom-filter#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidBloomFilterLengthError";
	}
}
