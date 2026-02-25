import { ValidationError } from "../errors/index.js";

/**
 * Error thrown when a trie proof is invalid
 */
export class InvalidTrieProofError extends ValidationError {
	/**
	 * @param {string} [message]
	 * @param {object} [options]
	 * @param {number} [options.code]
	 * @param {unknown} [options.value]
	 * @param {string} [options.expected]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message, options) {
		super(message || "Invalid trie proof", {
			code: options?.code ?? -32000,
			value: options?.value,
			expected: options?.expected || "valid merkle proof",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/trie#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidTrieProofError";
	}
}

/**
 * Error thrown when a trie key is invalid
 */
export class InvalidTrieKeyError extends ValidationError {
	/**
	 * @param {string} [message]
	 * @param {object} [options]
	 * @param {number} [options.code]
	 * @param {unknown} [options.value]
	 * @param {string} [options.expected]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message, options) {
		super(message || "Invalid trie key", {
			code: options?.code ?? -32602,
			value: options?.value,
			expected: options?.expected || "Uint8Array key",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/trie#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidTrieKeyError";
	}
}

/**
 * Error thrown when the trie is in a corrupted state
 */
export class CorruptedTrieError extends ValidationError {
	/**
	 * @param {string} [message]
	 * @param {object} [options]
	 * @param {number} [options.code]
	 * @param {unknown} [options.value]
	 * @param {string} [options.expected]
	 * @param {Record<string, unknown>} [options.context]
	 * @param {string} [options.docsPath]
	 * @param {Error} [options.cause]
	 */
	constructor(message, options) {
		super(message || "Corrupted trie", {
			code: options?.code ?? -32000,
			value: options?.value,
			expected: options?.expected || "valid trie state",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/trie#error-handling",
			cause: options?.cause,
		});
		this.name = "CorruptedTrieError";
	}
}
