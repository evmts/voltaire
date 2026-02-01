/**
 * @typedef {Object} RpcBlockHeader
 * @property {string} parentHash - Parent block hash (32 bytes hex)
 * @property {string} sha3Uncles - Ommers hash (32 bytes hex)
 * @property {string} miner - Beneficiary address (20 bytes hex)
 * @property {string} stateRoot - State trie root (32 bytes hex)
 * @property {string} transactionsRoot - Transactions trie root (32 bytes hex)
 * @property {string} receiptsRoot - Receipts trie root (32 bytes hex)
 * @property {string} logsBloom - Logs bloom filter (256 bytes hex)
 * @property {string} difficulty - PoW difficulty (hex)
 * @property {string} number - Block number (hex)
 * @property {string} gasLimit - Gas limit (hex)
 * @property {string} gasUsed - Gas used (hex)
 * @property {string} timestamp - Unix timestamp (hex)
 * @property {string} extraData - Extra data (hex)
 * @property {string} mixHash - PoW mix hash (32 bytes hex)
 * @property {string} nonce - PoW nonce (8 bytes hex)
 * @property {string} [baseFeePerGas] - Base fee per gas (hex, EIP-1559)
 * @property {string} [withdrawalsRoot] - Withdrawals root (32 bytes hex, post-Shanghai)
 * @property {string} [blobGasUsed] - Blob gas used (hex, EIP-4844)
 * @property {string} [excessBlobGas] - Excess blob gas (hex, EIP-4844)
 * @property {string} [parentBeaconBlockRoot] - Parent beacon block root (32 bytes hex, EIP-4788)
 */
/**
 * Convert RPC block header format to BlockHeader
 *
 * Handles conversion of hex-encoded strings from JSON-RPC to native types.
 * Field names follow Ethereum JSON-RPC conventions (miner, sha3Uncles, etc).
 *
 * @see https://voltaire.tevm.sh/primitives/block-header for BlockHeader documentation
 * @since 0.1.42
 * @param {RpcBlockHeader} rpc - RPC block header object
 * @returns {import('./BlockHeaderType.js').BlockHeaderType} BlockHeader
 * @throws {import('../errors/index.js').InvalidFormatError} If hex format is invalid
 * @throws {import('../errors/index.js').InvalidLengthError} If field length is incorrect
 * @example
 * ```javascript
 * import * as BlockHeader from './primitives/BlockHeader/index.js';
 * const rpcHeader = {
 *   parentHash: "0x...",
 *   sha3Uncles: "0x...",
 *   miner: "0x...",
 *   stateRoot: "0x...",
 *   transactionsRoot: "0x...",
 *   receiptsRoot: "0x...",
 *   logsBloom: "0x...",
 *   difficulty: "0x0",
 *   number: "0x1",
 *   gasLimit: "0x1c9c380",
 *   gasUsed: "0x5208",
 *   timestamp: "0x5f5e100",
 *   extraData: "0x",
 *   mixHash: "0x...",
 *   nonce: "0x0000000000000000",
 *   baseFeePerGas: "0x3b9aca00"
 * };
 * const header = BlockHeader.fromRpc(rpcHeader);
 * ```
 */
export function fromRpc(rpc: RpcBlockHeader): import("./BlockHeaderType.js").BlockHeaderType;
export type RpcBlockHeader = {
    /**
     * - Parent block hash (32 bytes hex)
     */
    parentHash: string;
    /**
     * - Ommers hash (32 bytes hex)
     */
    sha3Uncles: string;
    /**
     * - Beneficiary address (20 bytes hex)
     */
    miner: string;
    /**
     * - State trie root (32 bytes hex)
     */
    stateRoot: string;
    /**
     * - Transactions trie root (32 bytes hex)
     */
    transactionsRoot: string;
    /**
     * - Receipts trie root (32 bytes hex)
     */
    receiptsRoot: string;
    /**
     * - Logs bloom filter (256 bytes hex)
     */
    logsBloom: string;
    /**
     * - PoW difficulty (hex)
     */
    difficulty: string;
    /**
     * - Block number (hex)
     */
    number: string;
    /**
     * - Gas limit (hex)
     */
    gasLimit: string;
    /**
     * - Gas used (hex)
     */
    gasUsed: string;
    /**
     * - Unix timestamp (hex)
     */
    timestamp: string;
    /**
     * - Extra data (hex)
     */
    extraData: string;
    /**
     * - PoW mix hash (32 bytes hex)
     */
    mixHash: string;
    /**
     * - PoW nonce (8 bytes hex)
     */
    nonce: string;
    /**
     * - Base fee per gas (hex, EIP-1559)
     */
    baseFeePerGas?: string | undefined;
    /**
     * - Withdrawals root (32 bytes hex, post-Shanghai)
     */
    withdrawalsRoot?: string | undefined;
    /**
     * - Blob gas used (hex, EIP-4844)
     */
    blobGasUsed?: string | undefined;
    /**
     * - Excess blob gas (hex, EIP-4844)
     */
    excessBlobGas?: string | undefined;
    /**
     * - Parent beacon block root (32 bytes hex, EIP-4788)
     */
    parentBeaconBlockRoot?: string | undefined;
};
//# sourceMappingURL=fromRpc.d.ts.map