import {
	InvalidLengthError,
	InvalidRangeError,
	ValidationError,
} from "../errors/index.js";

/**
 * Error thrown when blob size is invalid
 *
 * @example
 * ```typescript
 * throw new InvalidBlobSizeError(
 *   'Invalid blob size: 100 (expected 131072)',
 *   {
 *     value: 100,
 *     expected: '131072 bytes',
 *     code: 'BLOB_INVALID_SIZE',
 *     docsPath: '/primitives/blob#error-handling'
 *   }
 * )
 * ```
 */
export class InvalidBlobSizeError extends InvalidLengthError {
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
		super(message || "Invalid blob size", {
			code: options?.code ?? -32602,
			value: options?.value,
			expected: options?.expected || "131072 bytes",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/blob#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidBlobSizeError";
	}
}

/**
 * Error thrown when commitment size is invalid
 *
 * @example
 * ```typescript
 * throw new InvalidCommitmentSizeError(
 *   'Invalid commitment size: 32 (expected 48)',
 *   {
 *     value: 32,
 *     expected: '48 bytes',
 *     code: 'BLOB_INVALID_COMMITMENT_SIZE',
 *     docsPath: '/primitives/blob#error-handling'
 *   }
 * )
 * ```
 */
export class InvalidCommitmentSizeError extends InvalidLengthError {
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
		super(message || "Invalid commitment size", {
			code: options?.code ?? -32602,
			value: options?.value,
			expected: options?.expected || "48 bytes",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/blob#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidCommitmentSizeError";
	}
}

/**
 * Error thrown when proof size is invalid
 *
 * @example
 * ```typescript
 * throw new InvalidProofSizeError(
 *   'Invalid proof size: 32 (expected 48)',
 *   {
 *     value: 32,
 *     expected: '48 bytes',
 *     code: 'BLOB_INVALID_PROOF_SIZE',
 *     docsPath: '/primitives/blob#error-handling'
 *   }
 * )
 * ```
 */
export class InvalidProofSizeError extends InvalidLengthError {
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
		super(message || "Invalid proof size", {
			code: options?.code ?? -32602,
			value: options?.value,
			expected: options?.expected || "48 bytes",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/blob#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidProofSizeError";
	}
}

/**
 * Error thrown when blob count exceeds maximum per transaction
 *
 * @example
 * ```typescript
 * throw new InvalidBlobCountError(
 *   'Invalid blob count: 7 (max 6)',
 *   {
 *     value: 7,
 *     expected: '0-6 blobs',
 *     code: 'BLOB_INVALID_COUNT',
 *     docsPath: '/primitives/blob#error-handling'
 *   }
 * )
 * ```
 */
export class InvalidBlobCountError extends InvalidRangeError {
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
		super(message || "Invalid blob count", {
			code: options?.code ?? -32602,
			value: options?.value,
			expected: options?.expected || "0-6 blobs",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/blob#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidBlobCountError";
	}
}

/**
 * Error thrown when data size is invalid
 *
 * @example
 * ```typescript
 * throw new InvalidBlobDataSizeError(
 *   'Data too large: 200000 bytes (max 126972)',
 *   {
 *     value: 200000,
 *     expected: 'max 126972 bytes',
 *     code: 'BLOB_INVALID_DATA_SIZE',
 *     docsPath: '/primitives/blob#error-handling'
 *   }
 * )
 * ```
 */
export class InvalidBlobDataSizeError extends InvalidRangeError {
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
		super(message || "Invalid blob data size", {
			code: options?.code ?? -32602,
			value: options?.value,
			expected: options?.expected || "valid data size",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/blob#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidBlobDataSizeError";
	}
}

/**
 * Error thrown when length prefix in blob is invalid
 *
 * @example
 * ```typescript
 * throw new InvalidBlobLengthPrefixError(
 *   'Invalid length prefix: 200000 (max 126972)',
 *   {
 *     value: 200000,
 *     expected: 'max 126972',
 *     code: 'BLOB_INVALID_LENGTH_PREFIX',
 *     docsPath: '/primitives/blob#error-handling'
 *   }
 * )
 * ```
 */
export class InvalidBlobLengthPrefixError extends InvalidRangeError {
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
		super(message || "Invalid length prefix", {
			code: options?.code ?? -32602,
			value: options?.value,
			expected: options?.expected || "valid length prefix",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/blob#error-handling",
			cause: options?.cause,
		});
		this.name = "InvalidBlobLengthPrefixError";
	}
}

/**
 * Error thrown when array lengths don't match in batch operations
 *
 * @example
 * ```typescript
 * throw new BlobArrayLengthMismatchError(
 *   'Arrays must have same length',
 *   {
 *     value: { blobs: 3, commitments: 2, proofs: 3 },
 *     expected: 'equal array lengths',
 *     code: 'BLOB_ARRAY_LENGTH_MISMATCH',
 *     docsPath: '/primitives/blob#error-handling'
 *   }
 * )
 * ```
 */
export class BlobArrayLengthMismatchError extends ValidationError {
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
		super(message || "Arrays must have same length", {
			code: options?.code ?? -32602,
			value: options?.value,
			expected: options?.expected || "equal array lengths",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/blob#error-handling",
			cause: options?.cause,
		});
		this.name = "BlobArrayLengthMismatchError";
	}
}

/**
 * Error thrown when operation is not implemented
 *
 * @example
 * ```typescript
 * throw new BlobNotImplementedError(
 *   'Not implemented',
 *   {
 *     value: 'verifyBatch',
 *     expected: 'implementation',
 *     code: 'BLOB_NOT_IMPLEMENTED',
 *     docsPath: '/primitives/blob#error-handling'
 *   }
 * )
 * ```
 */
export class BlobNotImplementedError extends ValidationError {
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
		super(message || "Not implemented", {
			code: options?.code ?? -32000,
			value: options?.value,
			expected: options?.expected || "implementation",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/blob#error-handling",
			cause: options?.cause,
		});
		this.name = "BlobNotImplementedError";
	}
}
