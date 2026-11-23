import { toBytes } from "../Hex/toBytes.js";
import { from } from "./from.js";

/**
 * Convert hex string to bigint, handling undefined/null
 * @param {string | undefined | null} hex
 * @returns {bigint}
 */
function hexToBigInt(hex) {
	if (!hex) return 0n;
	return BigInt(hex);
}

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
export function fromRpc(rpc) {
	return from({
		parentHash: rpc.parentHash,
		ommersHash: rpc.sha3Uncles,
		beneficiary: rpc.miner,
		stateRoot: rpc.stateRoot,
		transactionsRoot: rpc.transactionsRoot,
		receiptsRoot: rpc.receiptsRoot,
		logsBloom: toBytes(rpc.logsBloom),
		difficulty: hexToBigInt(rpc.difficulty),
		number: hexToBigInt(rpc.number),
		gasLimit: hexToBigInt(rpc.gasLimit),
		gasUsed: hexToBigInt(rpc.gasUsed),
		timestamp: hexToBigInt(rpc.timestamp),
		extraData: toBytes(rpc.extraData),
		mixHash: rpc.mixHash,
		nonce: toBytes(rpc.nonce),
		...(rpc.baseFeePerGas != null && {
			baseFeePerGas: hexToBigInt(rpc.baseFeePerGas),
		}),
		...(rpc.withdrawalsRoot != null && {
			withdrawalsRoot: rpc.withdrawalsRoot,
		}),
		...(rpc.blobGasUsed != null && {
			blobGasUsed: hexToBigInt(rpc.blobGasUsed),
		}),
		...(rpc.excessBlobGas != null && {
			excessBlobGas: hexToBigInt(rpc.excessBlobGas),
		}),
		...(rpc.parentBeaconBlockRoot != null && {
			parentBeaconBlockRoot: rpc.parentBeaconBlockRoot,
		}),
		...(rpc.requestsHash != null && { requestsHash: rpc.requestsHash }),
		...(rpc.blockAccessListHash != null && {
			blockAccessListHash: rpc.blockAccessListHash,
		}),
	});
}
