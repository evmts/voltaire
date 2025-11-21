export type { ReceiptType } from "./ReceiptType.js";
export * from "./errors.js";

import type { ReceiptType } from "./ReceiptType.js";
import { assertValid as _assertValid } from "./assertValid.js";
import { from as _from } from "./from.js";
import { isPreByzantium as _isPreByzantium } from "./isPreByzantium.js";

export const from = _from;

export function assertValid(receipt: ReceiptType): void {
	return _assertValid(receipt);
}

export function isPreByzantium(receipt: ReceiptType): boolean {
	return _isPreByzantium(receipt);
}

export { _assertValid, _isPreByzantium };

/**
 * TransactionReceipt - alias for Receipt
 */
export type { ReceiptType as TransactionReceiptType } from "./ReceiptType.js";
