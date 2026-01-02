import { from as addressFrom } from "../Address/internal-index.js";
import { from as blockHashFrom } from "../BlockHash/index.js";
import { from as blockNumberFrom } from "../BlockNumber/index.js";
import { from as hashFrom } from "../Hash/index.js";
import { toBytes } from "../Hex/toBytes.js";
import { from as uint256From } from "../Uint/index.js";

/**
 * Convert hex string to bigint, handling null/undefined
 * @param {string | null | undefined} hex
 * @returns {bigint}
 */
function hexToBigInt(hex) {
	if (!hex) return 0n;
	return BigInt(hex);
}

/**
 * Convert hex string to Uint8Array, handling null/undefined
 * @param {string | null | undefined} hex
 * @returns {Uint8Array}
 */
function hexToBytes(hex) {
	if (!hex || hex === "0x") return new Uint8Array(0);
	return toBytes(hex);
}

/**
 * @typedef {Object} RpcBlockHeader
 * @property {string} parentHash - Parent block hash
 * @property {string} sha3Uncles - Uncles/ommers hash
 * @property {string} miner - Beneficiary address (also known as coinbase)
 * @property {string} stateRoot - State trie root
 * @property {string} transactionsRoot - Transactions trie root
 * @property {string} receiptsRoot - Receipts trie root
 * @property {string} logsBloom - Bloom filter for logs (512 hex chars)
 * @property {string} difficulty - Block difficulty
 * @property {string} number - Block number
 * @property {string} gasLimit - Gas limit
 * @property {string} gasUsed - Gas used
 * @property {string} timestamp - Unix timestamp
 * @property {string} extraData - Extra data
 * @property {string} mixHash - Mix hash (PoW)
 * @property {string} nonce - Nonce (PoW)
 * @property {string | null} [baseFeePerGas] - Base fee per gas (EIP-1559)
 * @property {string | null} [withdrawalsRoot] - Withdrawals root (post-Shanghai)
 * @property {string | null} [blobGasUsed] - Blob gas used (EIP-4844)
 * @property {string | null} [excessBlobGas] - Excess blob gas (EIP-4844)
 * @property {string | null} [parentBeaconBlockRoot] - Parent beacon block root (EIP-4788)
 */

/**
 * Create BlockHeader from JSON-RPC response
 *
 * Converts hex-encoded RPC fields to appropriate internal types:
 * - Hex strings (0x...) to bigint for numeric fields
 * - Hex strings to Uint8Array for byte fields
 * - Maps RPC field names to internal names (sha3Uncles -> ommersHash, miner -> beneficiary)
 *
 * @see https://voltaire.tevm.sh/primitives/block-header for BlockHeader documentation
 * @since 0.1.42
 * @param {RpcBlockHeader} rpc - JSON-RPC block header fields
 * @returns {import('./BlockHeaderType.js').BlockHeaderType} BlockHeader
 *
 * @example
 * ```javascript
 * import * as BlockHeader from './primitives/BlockHeader/index.js';
 *
 * // From eth_getBlockByNumber response
 * const header = BlockHeader.fromRpc({
 *   parentHash: "0x1234...",
 *   sha3Uncles: "0x5678...",
 *   miner: "0xabcd...",
 *   stateRoot: "0xef01...",
 *   transactionsRoot: "0x2345...",
 *   receiptsRoot: "0x6789...",
 *   logsBloom: "0x00000...",
 *   difficulty: "0x0",
 *   number: "0x12345",
 *   gasLimit: "0x1c9c380",
 *   gasUsed: "0xd1a2b3",
 *   timestamp: "0x65e8c8b7",
 *   extraData: "0x",
 *   mixHash: "0x0000...",
 *   nonce: "0x0000000000000000",
 *   baseFeePerGas: "0x7a1225a00",
 *   withdrawalsRoot: "0xd4e5...",
 *   blobGasUsed: "0x40000",
 *   excessBlobGas: "0x20000",
 *   parentBeaconBlockRoot: "0xe5f6..."
 * });
 * ```
 */
export function fromRpc(rpc) {
	return /** @type {import('./BlockHeaderType.js').BlockHeaderType} */ ({
		parentHash: blockHashFrom(rpc.parentHash),
		ommersHash: hashFrom(rpc.sha3Uncles),
		beneficiary: addressFrom(rpc.miner),
		stateRoot: hashFrom(rpc.stateRoot),
		transactionsRoot: hashFrom(rpc.transactionsRoot),
		receiptsRoot: hashFrom(rpc.receiptsRoot),
		logsBloom: hexToBytes(rpc.logsBloom),
		difficulty: uint256From(hexToBigInt(rpc.difficulty)),
		number: blockNumberFrom(hexToBigInt(rpc.number)),
		gasLimit: uint256From(hexToBigInt(rpc.gasLimit)),
		gasUsed: uint256From(hexToBigInt(rpc.gasUsed)),
		timestamp: uint256From(hexToBigInt(rpc.timestamp)),
		extraData: hexToBytes(rpc.extraData),
		mixHash: hashFrom(rpc.mixHash),
		nonce: hexToBytes(rpc.nonce),
		...(rpc.baseFeePerGas !== undefined &&
			rpc.baseFeePerGas !== null && {
				baseFeePerGas: uint256From(hexToBigInt(rpc.baseFeePerGas)),
			}),
		...(rpc.withdrawalsRoot !== undefined &&
			rpc.withdrawalsRoot !== null && {
				withdrawalsRoot: hashFrom(rpc.withdrawalsRoot),
			}),
		...(rpc.blobGasUsed !== undefined &&
			rpc.blobGasUsed !== null && {
				blobGasUsed: uint256From(hexToBigInt(rpc.blobGasUsed)),
			}),
		...(rpc.excessBlobGas !== undefined &&
			rpc.excessBlobGas !== null && {
				excessBlobGas: uint256From(hexToBigInt(rpc.excessBlobGas)),
			}),
		...(rpc.parentBeaconBlockRoot !== undefined &&
			rpc.parentBeaconBlockRoot !== null && {
				parentBeaconBlockRoot: hashFrom(rpc.parentBeaconBlockRoot),
			}),
	});
}
