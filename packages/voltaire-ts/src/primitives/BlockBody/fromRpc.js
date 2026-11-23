import { InvalidFormatError } from "../errors/index.js";
import { fromRpc as transactionFromRpc } from "../Transaction/fromRpc.js";
import { fromRpc as withdrawalFromRpc } from "../Withdrawal/fromRpc.js";
import { from } from "./from.js";

/**
 * @typedef {import('../Transaction/fromRpc.js').RpcTransaction} RpcTransaction
 * @typedef {import('../Withdrawal/fromRpc.js').RpcWithdrawal} RpcWithdrawal
 */

/**
 * @typedef {Object} RpcBlockBody
 * @property {RpcTransaction[]} transactions - Array of RPC transactions
 * @property {any[]} [uncles] - Array of uncle blocks (ommers)
 * @property {RpcWithdrawal[]} [withdrawals] - Array of RPC withdrawals (post-Shanghai)
 */

/**
 * Convert RPC block body format to BlockBody
 *
 * Handles conversion of transactions and withdrawals from JSON-RPC format.
 * Requires full transaction objects (`eth_getBlockByNumber(block, true)`).
 * A hash-only body (`transactions` is an array of hash strings) is rejected:
 * a hash carries no transaction fields to decode.
 * Note: Uncle (ommer) parsing is not yet implemented - they are passed through as-is.
 *
 * @see https://voltaire.tevm.sh/primitives/block-body for BlockBody documentation
 * @since 0.1.42
 * @param {RpcBlockBody} rpc - RPC block body object
 * @returns {import('./BlockBodyType.js').BlockBodyType} BlockBody
 * @throws {InvalidFormatError} If `transactions` holds transaction hashes instead of objects
 * @throws {import('../errors/index.js').InvalidTransactionTypeError} If transaction type is unknown
 * @throws {import('../errors/index.js').InvalidLengthError} If field length is incorrect
 * @example
 * ```javascript
 * import * as BlockBody from './primitives/BlockBody/index.js';
 * const rpcBody = {
 *   transactions: [
 *     { type: "0x2", nonce: "0x1", ... }
 *   ],
 *   uncles: [],
 *   withdrawals: [
 *     { index: "0x1", validatorIndex: "0x2", address: "0x...", amount: "0x..." }
 *   ]
 * };
 * const body = BlockBody.fromRpc(rpcBody);
 * ```
 */
export function fromRpc(rpc) {
	const transactions = rpc.transactions.map((tx, index) => {
		if (typeof tx === "string") {
			throw new InvalidFormatError(
				"BlockBody.fromRpc requires full transaction objects, got a transaction hash. Fetch the block with full transactions (eth_getBlockByNumber(block, true)).",
				{
					code: -32602,
					value: tx,
					expected: "JSON-RPC transaction object",
					context: { index },
					docsPath: "/primitives/block-body#error-handling",
				},
			);
		}
		return transactionFromRpc(tx);
	});

	// Note: Uncles/ommers are passed through - full parsing not yet implemented
	const ommers = rpc.uncles || [];

	const withdrawals = rpc.withdrawals
		? rpc.withdrawals.map((w) => withdrawalFromRpc(w))
		: undefined;

	return from({
		transactions,
		ommers,
		...(withdrawals !== undefined && { withdrawals }),
	});
}
