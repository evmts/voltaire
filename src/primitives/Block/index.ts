// Export type
export type { BlockType } from "./BlockType.js";

// Import internal functions
import { from as _from } from "./from.js";
import { fromRpc as _fromRpc } from "./fromRpc.js";

// Export internal functions (tree-shakeable)
export { _from };
export { _fromRpc };

// Export public functions
export function from(params: {
	header: import("../BlockHeader/BlockHeaderType.js").BlockHeaderType;
	body: import("../BlockBody/BlockBodyType.js").BlockBodyType;
	hash: import("../BlockHash/BlockHashType.js").BlockHashType | string;
	size: bigint | number | string;
	totalDifficulty?: bigint | number | string;
}) {
	return _from(params);
}

/**
 * RPC Withdrawal type
 */
export interface RpcWithdrawal {
	index: string;
	validatorIndex: string;
	address: string;
	amount: string;
}

/**
 * RPC Block response (from eth_getBlockByNumber/Hash)
 */
export interface RpcBlock {
	hash: string;
	parentHash: string;
	sha3Uncles: string;
	miner: string;
	stateRoot: string;
	transactionsRoot: string;
	receiptsRoot: string;
	logsBloom: string;
	difficulty: string;
	number: string;
	gasLimit: string;
	gasUsed: string;
	timestamp: string;
	extraData: string;
	mixHash: string;
	nonce: string;
	size: string;
	totalDifficulty?: string | null;
	baseFeePerGas?: string | null;
	withdrawalsRoot?: string | null;
	blobGasUsed?: string | null;
	excessBlobGas?: string | null;
	parentBeaconBlockRoot?: string | null;
	transactions?: Array<
		import("../Transaction/fromRpc.js").RpcTransaction | string
	>;
	uncles?: string[];
	withdrawals?: RpcWithdrawal[];
}

/**
 * Options for fromRpc
 */
export interface FromRpcOptions {
	/** Whether to parse transaction objects (false if response has tx hashes only) */
	includeTransactions?: boolean;
}

/**
 * Create Block from JSON-RPC response
 */
export function fromRpc(
	rpc: RpcBlock,
	options?: FromRpcOptions,
): import("./BlockType.js").BlockType {
	return _fromRpc(rpc, options);
}

// Namespace export
export const Block = {
	from,
	fromRpc,
};
