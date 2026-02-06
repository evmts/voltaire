export type { BlockBodyType } from "./BlockBodyType.js";
import { from as _from } from "./from.js";
import { fromRpc as _fromRpc } from "./fromRpc.js";
export { _from, _fromRpc };
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
export declare function from(params: {
    transactions: readonly AnyTransaction[];
    ommers: readonly UncleType[];
    withdrawals?: readonly WithdrawalType[];
}): import("./BlockBodyType.js").BlockBodyType;
/**
 * Convert RPC block body format to BlockBody
 */
export declare function fromRpc(rpc: RpcBlockBody): import("./BlockBodyType.js").BlockBodyType;
export declare const BlockBody: {
    from: typeof from;
    fromRpc: typeof fromRpc;
};
//# sourceMappingURL=index.d.ts.map