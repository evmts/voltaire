/**
 * @typedef {import('./TransactionStreamType.js').PendingTransaction} PendingTransaction
 */
import { getTransactionType } from "./getTransactionType.js";
import { hexToBytes } from "./hexToBytes.js";
/**
 * Parse transaction from RPC response
 * @param {any} tx
 * @returns {PendingTransaction}
 */
export function parsePendingTransaction(tx) {
    return /** @type {PendingTransaction} */ ({
        hash: hexToBytes(tx.hash),
        from: hexToBytes(tx.from),
        to: tx.to ? hexToBytes(tx.to) : null,
        value: BigInt(tx.value || "0x0"),
        gas: BigInt(tx.gas),
        gasPrice: BigInt(tx.gasPrice || tx.maxFeePerGas || "0x0"),
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas
            ? BigInt(tx.maxPriorityFeePerGas)
            : undefined,
        maxFeePerGas: tx.maxFeePerGas ? BigInt(tx.maxFeePerGas) : undefined,
        nonce: BigInt(tx.nonce),
        input: hexToBytes(tx.input || tx.data || "0x"),
        type: getTransactionType(tx.type),
    });
}
