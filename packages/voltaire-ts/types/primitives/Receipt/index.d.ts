export * from "./errors.js";
export type { ReceiptType } from "./ReceiptType.js";
import { assertValid as _assertValid } from "./assertValid.js";
import { from as _from } from "./from.js";
import { isPreByzantium as _isPreByzantium } from "./isPreByzantium.js";
import { poll as _poll } from "./poll.js";
import type { ReceiptType } from "./ReceiptType.js";
export declare const from: typeof _from;
export declare function assertValid(receipt: ReceiptType): void;
export declare function isPreByzantium(receipt: ReceiptType): boolean;
/**
 * Poll for a transaction receipt until confirmed
 *
 * @param txHash - Transaction hash to poll for
 * @param provider - EIP-1193 provider
 * @param options - Polling options (interval, timeout, confirmations)
 * @returns Promise resolving to the transaction receipt
 *
 * @example
 * ```typescript
 * import { Receipt } from '@tevm/voltaire';
 *
 * const receipt = await Receipt.poll(txHash, provider, {
 *   timeout: 120000,
 *   confirmations: 3
 * });
 * ```
 */
export declare const poll: (txHash: string, provider: {
    request(args: {
        method: string;
        params?: unknown[];
    }): Promise<unknown>;
}, options?: {
    interval?: number;
    timeout?: number;
    confirmations?: number;
}) => Promise<ReceiptType>;
export { _assertValid, _isPreByzantium, _poll };
/**
 * TransactionReceipt - alias for Receipt
 */
export type { ReceiptType as TransactionReceiptType } from "./ReceiptType.js";
//# sourceMappingURL=index.d.ts.map