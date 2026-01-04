// Export type
export type { BlockType } from "./BlockType.js";

// Import internal functions
import { from as _from } from "./from.js";
import { fromRpc as _fromRpc } from "./fromRpc.js";

// Export internal functions (tree-shakeable)
export { _from, _fromRpc };

// Re-export RPC types from dependencies
export type { RpcBlockHeader } from "../BlockHeader/index.js";
export type { RpcBlockBody, RpcWithdrawal } from "../BlockBody/index.js";

/**
 * RPC block format (full JSON-RPC eth_getBlockByNumber/Hash response)
 */
export type RpcBlock = import("../BlockHeader/index.js").RpcBlockHeader &
	import("../BlockBody/index.js").RpcBlockBody & {
		hash: string;
		size: string;
		totalDifficulty?: string;
	};

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
 * Convert RPC block format to Block
 *
 * Use this to parse JSON-RPC responses from eth_getBlockByNumber or eth_getBlockByHash.
 * Handles conversion of all hex-encoded strings to native types.
 */
export function fromRpc(rpc: RpcBlock) {
	return _fromRpc(rpc);
}

// Namespace export
export const Block = {
	from,
	fromRpc,
};
