/**
 * @typedef {import('./TransactionStreamType.js').PendingTransaction} PendingTransaction
 * @typedef {import('./TransactionStreamType.js').TransactionFilter} TransactionFilter
 */
import { bytesToHex } from "./bytesToHex.js";
import { hexToBytes } from "./hexToBytes.js";
/**
 * Check if transaction matches filter
 * @param {PendingTransaction} tx
 * @param {TransactionFilter | undefined} filter
 * @returns {boolean}
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: transaction filtering logic
export function matchesFilter(tx, filter) {
    if (!filter)
        return true;
    if (filter.from) {
        const filterFrom = typeof filter.from === "string" ? hexToBytes(filter.from) : filter.from;
        if (bytesToHex(tx.from) !== bytesToHex(filterFrom))
            return false;
    }
    if (filter.to) {
        if (!tx.to)
            return false;
        const filterTo = typeof filter.to === "string" ? hexToBytes(filter.to) : filter.to;
        if (bytesToHex(tx.to) !== bytesToHex(filterTo))
            return false;
    }
    if (filter.methodId && tx.input.length >= 4) {
        const filterMethod = typeof filter.methodId === "string"
            ? hexToBytes(filter.methodId)
            : filter.methodId;
        const txMethod = tx.input.slice(0, 4);
        if (bytesToHex(txMethod) !== bytesToHex(filterMethod))
            return false;
    }
    if (filter.minValue !== undefined && tx.value < filter.minValue)
        return false;
    if (filter.maxValue !== undefined && tx.value > filter.maxValue)
        return false;
    return true;
}
