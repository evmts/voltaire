/**
 * @typedef {import('./ReceiptType.js').ReceiptType} ReceiptType
 */
/**
 * Poll options for receipt
 */
/** @typedef {{ interval?: number; timeout?: number; confirmations?: number }} PollReceiptOptions */
/**
 * Poll for a transaction receipt until it's available
 *
 * Uses exponential backoff and handles transient RPC errors gracefully.
 *
 * @param {string} txHash - Transaction hash to poll for
 * @param {{ request(args: { method: string; params?: unknown[] }): Promise<unknown> }} provider - EIP-1193 provider
 * @param {PollReceiptOptions} [options] - Polling options
 * @returns {Promise<ReceiptType>} Transaction receipt
 * @throws {Error} If timeout is reached before receipt is available
 *
 * @example
 * ```typescript
 * import { poll } from '@tevm/voltaire/Receipt';
 *
 * // Wait for transaction confirmation
 * const receipt = await poll(txHash, provider);
 * console.log(`Status: ${receipt.status}`);
 *
 * // With custom options
 * const receipt = await poll(txHash, provider, {
 *   interval: 2000,      // Poll every 2s
 *   timeout: 120000,     // Wait up to 2 minutes
 *   confirmations: 3     // Wait for 3 confirmations
 * });
 * ```
 */
export function poll(txHash: string, provider: {
    request(args: {
        method: string;
        params?: unknown[];
    }): Promise<unknown>;
}, options?: PollReceiptOptions): Promise<ReceiptType>;
export type ReceiptType = import("./ReceiptType.js").ReceiptType;
export type PollReceiptOptions = {
    interval?: number;
    timeout?: number;
    confirmations?: number;
};
//# sourceMappingURL=poll.d.ts.map