// Export type
export type { BlockBodyType } from "./BlockBodyType.js";

// Import internal functions
import { from as _from } from "./from.js";
import { fromRpc as _fromRpc } from "./fromRpc.js";

// Export internal functions (tree-shakeable)
export { _from, _fromRpc };

// Type imports for function parameters
type AnyTransaction = import("../Transaction/types.js").Any;
type UncleType = import("../Uncle/UncleType.js").UncleType;
type WithdrawalType = import("../Withdrawal/WithdrawalType.js").WithdrawalType;
type RpcTransaction = import("../Transaction/fromRpc.js").RpcTransaction;

/**
 * RPC withdrawal format
 */
export type RpcWithdrawal = {
	index: string;
	validatorIndex: string;
	address: string;
	amount: string;
};

/**
 * RPC block body format (subset of JSON-RPC block response)
 */
export type RpcBlockBody = {
	transactions: RpcTransaction[];
	uncles?: unknown[];
	withdrawals?: RpcWithdrawal[];
};

// Export public functions
export function from(params: {
	transactions: readonly AnyTransaction[];
	ommers: readonly UncleType[];
	withdrawals?: readonly WithdrawalType[];
}) {
	return _from(params);
}

/**
 * Convert RPC block body format to BlockBody
 */
export function fromRpc(rpc: RpcBlockBody) {
	return _fromRpc(rpc);
}

// Namespace export
export const BlockBody = {
	from,
	fromRpc,
};
