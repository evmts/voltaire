export type { BlockType } from "./BlockType.js";
import { calculateHash as _calculateHash } from "./calculateHash.js";
import { from as _from } from "./from.js";
import { fromRpc as _fromRpc } from "./fromRpc.js";
export { _from, _fromRpc, _calculateHash };
export type { RpcBlockBody, RpcWithdrawal } from "../BlockBody/index.js";
export type { RpcBlockHeader } from "../BlockHeader/index.js";
/**
 * RPC block format (full JSON-RPC eth_getBlockByNumber/Hash response)
 */
export type RpcBlock = import("../BlockHeader/index.js").RpcBlockHeader & import("../BlockBody/index.js").RpcBlockBody & {
    hash: string;
    size: string;
    totalDifficulty?: string;
};
export declare function from(params: {
    header: import("../BlockHeader/BlockHeaderType.js").BlockHeaderType;
    body: import("../BlockBody/BlockBodyType.js").BlockBodyType;
    hash: import("../BlockHash/BlockHashType.js").BlockHashType | string;
    size: bigint | number | string;
    totalDifficulty?: bigint | number | string;
}): import("./BlockType.js").BlockType;
/**
 * Convert RPC block format to Block
 *
 * Use this to parse JSON-RPC responses from eth_getBlockByNumber or eth_getBlockByHash.
 * Handles conversion of all hex-encoded strings to native types.
 */
export declare function fromRpc(rpc: RpcBlock): import("./BlockType.js").BlockType;
export declare function calculateHash(block: import("./BlockType.js").BlockType): import("../BlockHash/BlockHashType.js").BlockHashType;
export declare const Block: {
    from: typeof from;
    fromRpc: typeof fromRpc;
    calculateHash: typeof calculateHash;
};
//# sourceMappingURL=index.d.ts.map