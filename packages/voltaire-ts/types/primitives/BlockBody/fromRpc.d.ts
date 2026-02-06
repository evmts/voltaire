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
 * Note: Uncle (ommer) parsing is not yet implemented - they are passed through as-is.
 *
 * @see https://voltaire.tevm.sh/primitives/block-body for BlockBody documentation
 * @since 0.1.42
 * @param {RpcBlockBody} rpc - RPC block body object
 * @returns {import('./BlockBodyType.js').BlockBodyType} BlockBody
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
export function fromRpc(rpc: RpcBlockBody): import("./BlockBodyType.js").BlockBodyType;
export type RpcTransaction = import("../Transaction/fromRpc.js").RpcTransaction;
export type RpcWithdrawal = import("../Withdrawal/fromRpc.js").RpcWithdrawal;
export type RpcBlockBody = {
    /**
     * - Array of RPC transactions
     */
    transactions: RpcTransaction[];
    /**
     * - Array of uncle blocks (ommers)
     */
    uncles?: any[] | undefined;
    /**
     * - Array of RPC withdrawals (post-Shanghai)
     */
    withdrawals?: import("../Withdrawal/fromRpc.js").RpcWithdrawal[] | undefined;
};
//# sourceMappingURL=fromRpc.d.ts.map