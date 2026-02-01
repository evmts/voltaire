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
    constructor(message?: string, options?: {
        code?: number | undefined;
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
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
    constructor(message?: string, options?: {
        code?: number | undefined;
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
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
    constructor(message?: string, options?: {
        code?: number | undefined;
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
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
    constructor(message?: string, options?: {
        code?: number | undefined;
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
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
    constructor(message?: string, options?: {
        code?: number | undefined;
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
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
    constructor(message?: string, options?: {
        code?: number | undefined;
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
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
    constructor(message?: string, options?: {
        code?: number | undefined;
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
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
    constructor(message?: string, options?: {
        code?: number | undefined;
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
}
import { InvalidLengthError } from "../errors/index.js";
import { InvalidRangeError } from "../errors/index.js";
import { ValidationError } from "../errors/index.js";
//# sourceMappingURL=errors.d.ts.map