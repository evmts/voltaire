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
    constructor(message?: string, options?: {
        code?: number | undefined;
        value?: unknown;
        expected?: string | undefined;
        context?: Record<string, unknown> | undefined;
        docsPath?: string | undefined;
        cause?: Error | undefined;
    });
}
import { ValidationError } from "../errors/index.js";
//# sourceMappingURL=errors.d.ts.map