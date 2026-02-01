import { from } from "./from.js";

/**
 * @typedef {Object} RpcWithdrawal
 * @property {string} index - Withdrawal index (hex)
 * @property {string} validatorIndex - Validator index (hex)
 * @property {string} address - Recipient address (hex)
 * @property {string} amount - Amount in Gwei (hex)
 */

/**
 * Convert RPC withdrawal format to Withdrawal
 *
 * @see https://voltaire.tevm.sh/primitives/withdrawal for Withdrawal documentation
 * @since 0.1.42
 * @param {RpcWithdrawal} rpc - RPC withdrawal object
 * @returns {import('./WithdrawalType.js').WithdrawalType} Withdrawal
 * @throws {never}
 * @example
 * ```javascript
 * import * as Withdrawal from './primitives/Withdrawal/index.js';
 * const rpcWithdrawal = {
 *   index: "0x1",
 *   validatorIndex: "0x2",
 *   address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
 *   amount: "0x773594000" // 32 ETH in Gwei
 * };
 * const withdrawal = Withdrawal.fromRpc(rpcWithdrawal);
 * ```
 */
export function fromRpc(rpc) {
	return from({
		index: BigInt(rpc.index),
		validatorIndex: BigInt(rpc.validatorIndex),
		address: rpc.address,
		amount: BigInt(rpc.amount),
	});
}
