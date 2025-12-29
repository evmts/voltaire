export type { ReceiptType } from "./ReceiptType.js";
export * from "./errors.js";

import type { ReceiptType } from "./ReceiptType.js";
import { assertValid as _assertValid } from "./assertValid.js";
import { from as _from } from "./from.js";
import { isPreByzantium as _isPreByzantium } from "./isPreByzantium.js";
import { poll as _poll } from "./poll.js";

export const from = _from;

export function assertValid(receipt: ReceiptType): void {
	return _assertValid(receipt);
}

export function isPreByzantium(receipt: ReceiptType): boolean {
	return _isPreByzantium(receipt);
}

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
export const poll: (
	txHash: string,
	provider: { request(args: { method: string; params?: unknown[] }): Promise<unknown> },
	options?: { interval?: number; timeout?: number; confirmations?: number },
) => Promise<ReceiptType> = _poll;

export { _assertValid, _isPreByzantium, _poll };

/**
 * TransactionReceipt - alias for Receipt
 */
export type { ReceiptType as TransactionReceiptType } from "./ReceiptType.js";
