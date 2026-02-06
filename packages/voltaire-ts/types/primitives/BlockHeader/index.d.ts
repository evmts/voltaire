export type { BlockHeaderType } from "./BlockHeaderType.js";
import { calculateHash as _calculateHash } from "./calculateHash.js";
import { from as _from } from "./from.js";
import { fromRpc as _fromRpc } from "./fromRpc.js";
export { _from, _fromRpc, _calculateHash };
export declare function from(params: {
    parentHash: import("../BlockHash/BlockHashType.js").BlockHashType | string;
    ommersHash: import("../Hash/HashType.js").HashType | string;
    beneficiary: import("../Address/AddressType.js").AddressType | string;
    stateRoot: import("../Hash/HashType.js").HashType | string;
    transactionsRoot: import("../Hash/HashType.js").HashType | string;
    receiptsRoot: import("../Hash/HashType.js").HashType | string;
    logsBloom: Uint8Array;
    difficulty: bigint | number | string;
    number: bigint | number;
    gasLimit: bigint | number | string;
    gasUsed: bigint | number | string;
    timestamp: bigint | number | string;
    extraData: Uint8Array;
    mixHash: import("../Hash/HashType.js").HashType | string;
    nonce: Uint8Array;
    baseFeePerGas?: bigint | number | string;
    withdrawalsRoot?: import("../Hash/HashType.js").HashType | string;
    blobGasUsed?: bigint | number | string;
    excessBlobGas?: bigint | number | string;
    parentBeaconBlockRoot?: import("../Hash/HashType.js").HashType | string;
}): import("./BlockHeaderType.js").BlockHeaderType;
/**
 * RPC block header format (JSON-RPC response)
 */
export type RpcBlockHeader = {
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
    baseFeePerGas?: string;
    withdrawalsRoot?: string;
    blobGasUsed?: string;
    excessBlobGas?: string;
    parentBeaconBlockRoot?: string;
};
/**
 * Convert RPC block header format to BlockHeader
 */
export declare function fromRpc(rpc: RpcBlockHeader): import("./BlockHeaderType.js").BlockHeaderType;
export declare function calculateHash(header: import("./BlockHeaderType.js").BlockHeaderType): import("../BlockHash/BlockHashType.js").BlockHashType;
export declare const BlockHeader: {
    from: typeof from;
    fromRpc: typeof fromRpc;
    calculateHash: typeof calculateHash;
};
//# sourceMappingURL=index.d.ts.map