export type { ReceiptType } from "./ReceiptType.js";
export * from "./errors.js";

import { from as _from } from "./from.js";

export const from = _from;

/**
 * TransactionReceipt - alias for Receipt
 */
export type { ReceiptType as TransactionReceiptType } from "./ReceiptType.js";
