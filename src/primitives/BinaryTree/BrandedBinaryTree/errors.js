import { InvalidLengthError, ValidationError } from "../../errors/index.js";

/**
 * Error thrown when an invalid address length is provided
 *
 * @example
 * ```typescript
 * throw new InvalidAddressLengthError(
 *   'Address must be 20 bytes',
 *   {
 *     value: addr.length,
 *     expected: '20 bytes',
 *     code: 'BINARY_TREE_INVALID_ADDRESS_LENGTH',
 *     docsPath: '/primitives/binary-tree/address-to-key#error-handling'
 *   }
 * )
 * ```
 */
export class InvalidAddressLengthError extends InvalidLengthError {
	/**
	 * @param {string} [message]
	 * @param {object} [options]
	 * @param {string} [options.code]
	 * @param {unknown} [options.value]
	 * @param {string} [options.expected]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message, options) {
		super(message || "Invalid address length", {
			code: options?.code || "BINARY_TREE_INVALID_ADDRESS_LENGTH",
			value: options?.value,
			expected: options?.expected || "20 bytes",
			context: options?.context,
			docsPath:
				options?.docsPath ||
				"/primitives/binary-tree/address-to-key#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidAddressLengthError";
	}
}

/**
 * Error thrown when an invalid key length is provided
 *
 * @example
 * ```typescript
 * throw new InvalidKeyLengthError(
 *   'Key must be 32 bytes',
 *   {
 *     value: key.length,
 *     expected: '32 bytes',
 *     code: 'BINARY_TREE_INVALID_KEY_LENGTH',
 *     docsPath: '/primitives/binary-tree/split-key#error-handling'
 *   }
 * )
 * ```
 */
export class InvalidKeyLengthError extends InvalidLengthError {
	/**
	 * @param {string} [message]
	 * @param {object} [options]
	 * @param {string} [options.code]
	 * @param {unknown} [options.value]
	 * @param {string} [options.expected]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message, options) {
		super(message || "Invalid key length", {
			code: options?.code || "BINARY_TREE_INVALID_KEY_LENGTH",
			value: options?.value,
			expected: options?.expected || "32 bytes",
			context: options?.context,
			docsPath:
				options?.docsPath || "/primitives/binary-tree/split-key#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidKeyLengthError";
	}
}

/**
 * Error thrown when tree is in invalid state
 *
 * @example
 * ```typescript
 * throw new InvalidTreeStateError(
 *   'Cannot insert into leaf node',
 *   {
 *     value: node.type,
 *     expected: 'empty, stem, or internal',
 *     code: 'BINARY_TREE_INVALID_STATE',
 *     docsPath: '/primitives/binary-tree/insert#error-handling'
 *   }
 * )
 * ```
 */
export class InvalidTreeStateError extends ValidationError {
	/**
	 * @param {string} [message]
	 * @param {object} [options]
	 * @param {string} [options.code]
	 * @param {unknown} [options.value]
	 * @param {string} [options.expected]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message, options) {
		super(message || "Invalid tree state", {
			code: options?.code || "BINARY_TREE_INVALID_STATE",
			value: options?.value,
			expected: options?.expected || "valid tree state",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/binary-tree#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidTreeStateError";
	}
}
