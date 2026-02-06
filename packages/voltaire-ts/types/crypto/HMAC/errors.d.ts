/**
 * HMAC Error classes
 *
 * @module HMAC/errors
 */
/**
 * Error thrown when HMAC key is empty
 */
export class EmptyKeyError extends Error {
    /**
     * @param {string} [message]
     */
    constructor(message?: string);
    /** @readonly */
    readonly _tag: "EmptyKeyError";
}
//# sourceMappingURL=errors.d.ts.map