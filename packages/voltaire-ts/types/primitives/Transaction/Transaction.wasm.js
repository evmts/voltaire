/**
 * WASM implementation of transaction operations
 * Uses WebAssembly bindings to Zig implementation
 */
import * as loader from "../../wasm-loader/loader.js";
import { InvalidTransactionTypeError } from "../errors/index.js";
/**
 * Transaction type enumeration
 */
export var TransactionType;
(function (TransactionType) {
    /** Legacy transaction (pre-EIP-2718) */
    TransactionType[TransactionType["Legacy"] = 0] = "Legacy";
    /** EIP-2930 access list transaction */
    TransactionType[TransactionType["EIP2930"] = 1] = "EIP2930";
    /** EIP-1559 fee market transaction */
    TransactionType[TransactionType["EIP1559"] = 2] = "EIP1559";
    /** EIP-4844 blob transaction */
    TransactionType[TransactionType["EIP4844"] = 3] = "EIP4844";
    /** EIP-7702 set code transaction */
    TransactionType[TransactionType["EIP7702"] = 4] = "EIP7702";
})(TransactionType || (TransactionType = {}));
/**
 * Detect transaction type from RLP-encoded data
 * @param data - RLP-encoded transaction data
 * @returns Transaction type (0-4)
 * @throws {InvalidTransactionTypeError} If transaction type is invalid
 */
export function detectTransactionType(data) {
    const input = new Uint8Array(data);
    const txType = loader.txDetectType(input);
    if (txType < 0 || txType > 4) {
        throw new InvalidTransactionTypeError(`Invalid transaction type: ${txType}`, {
            code: -32602,
            context: { txType },
            docsPath: "/primitives/transaction/wasm#error-handling",
        });
    }
    return txType;
}
// Re-export for convenience
export default {
    TransactionType,
    detectTransactionType,
};
