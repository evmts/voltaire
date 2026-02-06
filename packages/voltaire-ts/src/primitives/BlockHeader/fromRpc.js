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
		...(rpc.baseFeePerGas !== undefined && {
			baseFeePerGas: hexToBigInt(rpc.baseFeePerGas),
		}),
		...(rpc.withdrawalsRoot !== undefined && {
			withdrawalsRoot: rpc.withdrawalsRoot,
		}),
		...(rpc.blobGasUsed !== undefined && {
			blobGasUsed: hexToBigInt(rpc.blobGasUsed),
		}),
		...(rpc.excessBlobGas !== undefined && {
			excessBlobGas: hexToBigInt(rpc.excessBlobGas),
		}),
		...(rpc.parentBeaconBlockRoot !== undefined && {
			parentBeaconBlockRoot: rpc.parentBeaconBlockRoot,
		}),
	});
}
