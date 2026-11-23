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
 * @property {string | null} [baseFeePerGas] - Base fee per gas (hex, EIP-1559)
 * @property {string | null} [withdrawalsRoot] - Withdrawals root (32 bytes hex, post-Shanghai)
 * @property {string | null} [blobGasUsed] - Blob gas used (hex, EIP-4844)
 * @property {string | null} [excessBlobGas] - Excess blob gas (hex, EIP-4844)
 * @property {string | null} [parentBeaconBlockRoot] - Parent beacon block root (32 bytes hex, EIP-4788)
 * @property {string | null} [requestsHash] - Execution-requests commitment (32 bytes hex, EIP-7685)
 * @property {string | null} [blockAccessListHash] - Block access list commitment (32 bytes hex, EIP-7928)
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
 * import { BlockHeader } from "@tevm/voltaire";
 * const zeroHash = `0x${"00".repeat(32)}`;
 * const header = BlockHeader.fromRpc({
 *   parentHash: zeroHash,
 *   sha3Uncles: zeroHash,
 *   miner: `0x${"00".repeat(20)}`,
 *   stateRoot: zeroHash,
 *   transactionsRoot: zeroHash,
 *   receiptsRoot: zeroHash,
 *   logsBloom: `0x${"00".repeat(256)}`,
 *   difficulty: "0x0",
 *   number: "0x1",
 *   gasLimit: "0x1c9c380",
 *   gasUsed: "0x0",
 *   timestamp: "0x69303a57",
 *   extraData: "0x",
 *   mixHash: zeroHash,
 *   nonce: "0x0000000000000000",
 *   baseFeePerGas: "0x7",
 *   withdrawalsRoot: zeroHash,
 *   blobGasUsed: "0x0",
 *   excessBlobGas: "0x0",
 *   parentBeaconBlockRoot: zeroHash,
 *   requestsHash: "0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
 * });
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
    baseFeePerGas?: string | null | undefined;
    /**
     * - Withdrawals root (32 bytes hex, post-Shanghai)
     */
    withdrawalsRoot?: string | null | undefined;
    /**
     * - Blob gas used (hex, EIP-4844)
     */
    blobGasUsed?: string | null | undefined;
    /**
     * - Excess blob gas (hex, EIP-4844)
     */
    excessBlobGas?: string | null | undefined;
    /**
     * - Parent beacon block root (32 bytes hex, EIP-4788)
     */
    parentBeaconBlockRoot?: string | null | undefined;
    /**
     * - Execution-requests commitment (32 bytes hex, EIP-7685)
     */
    requestsHash?: string | null | undefined;
    /**
     * - Block access list commitment (32 bytes hex, EIP-7928)
     */
    blockAccessListHash?: string | null | undefined;
};
//# sourceMappingURL=fromRpc.d.ts.map