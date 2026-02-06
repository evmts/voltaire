/**
 * Error thrown when a transaction URL is invalid or malformed
 * @extends {InvalidFormatError}
 */
export class InvalidTransactionUrlError extends InvalidFormatError {
    /**
     * @param {string} [message] - Error message
     * @param {Record<string, unknown>} [details] - Additional error details
     */
    constructor(message?: string, details?: Record<string, unknown>);
    /**
     * Additional error details (url, scheme, address, chainId, etc.)
     * @type {Record<string, unknown> | undefined}
     */
    details: Record<string, unknown> | undefined;
}
import { InvalidFormatError } from "../errors/index.js";
//# sourceMappingURL=errors.d.ts.map