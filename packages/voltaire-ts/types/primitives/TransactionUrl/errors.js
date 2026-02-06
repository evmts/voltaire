import { InvalidFormatError } from "../errors/index.js";
/**
 * Error thrown when a transaction URL is invalid or malformed
 * @extends {InvalidFormatError}
 */
export class InvalidTransactionUrlError extends InvalidFormatError {
    /**
     * Additional error details (url, scheme, address, chainId, etc.)
     * @type {Record<string, unknown> | undefined}
     */
    details;
    /**
     * @param {string} [message] - Error message
     * @param {Record<string, unknown>} [details] - Additional error details
     */
    constructor(message, details) {
        super(message || "Invalid transaction URL", {
            code: -32602,
            value: details?.url,
            expected: "valid ERC-681 transaction URL",
            context: details,
            docsPath: "/primitives/transactionurl#error-handling",
        });
        this.name = "InvalidTransactionUrlError";
        this.details = details;
    }
}
