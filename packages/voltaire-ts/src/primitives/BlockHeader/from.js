import { from as addressFrom } from "../Address/internal-index.js";
import { from as blockHashFrom } from "../BlockHash/index.js";
import { from as blockNumberFrom } from "../BlockNumber/index.js";
import { from as hashFrom } from "../Hash/index.js";
import { from as uint256From } from "../Uint/index.js";

/**
 * @typedef {object} BlockHeaderParams
 * @property {string | Uint8Array} parentHash
 * @property {string | Uint8Array} ommersHash
 * @property {string | Uint8Array} beneficiary
 * @property {string | Uint8Array} stateRoot
 * @property {string | Uint8Array} transactionsRoot
 * @property {string | Uint8Array} receiptsRoot
 * @property {Uint8Array} logsBloom
 * @property {bigint} difficulty
 * @property {bigint} number
 * @property {bigint} gasLimit
 * @property {bigint} gasUsed
 * @property {bigint} timestamp
 * @property {Uint8Array} extraData
 * @property {string | Uint8Array} mixHash
 * @property {Uint8Array} nonce
 * @property {bigint | null} [baseFeePerGas]
 * @property {string | Uint8Array | null} [withdrawalsRoot]
 * @property {bigint | null} [blobGasUsed]
 * @property {bigint | null} [excessBlobGas]
 * @property {string | Uint8Array | null} [parentBeaconBlockRoot]
 * @property {string | Uint8Array | null} [requestsHash] - EIP-7685 commitment (Prague and later)
 * @property {string | Uint8Array | null} [blockAccessListHash] - EIP-7928 commitment (Amsterdam and later)
 */

/**
 * Create BlockHeader from components
 *
 * @param {BlockHeaderParams} params - BlockHeader parameters
 * @returns {import('./BlockHeaderType.js').BlockHeaderType} BlockHeader
 *
 * @example
 * ```javascript
 * import { BlockHeader } from "@tevm/voltaire";
 *
 * const zeroHash = `0x${"00".repeat(32)}`;
 * const header = BlockHeader.from({
 *   parentHash: zeroHash,
 *   ommersHash: zeroHash,
 *   beneficiary: `0x${"00".repeat(20)}`,
 *   stateRoot: zeroHash,
 *   transactionsRoot: zeroHash,
 *   receiptsRoot: zeroHash,
 *   logsBloom: new Uint8Array(256),
 *   difficulty: 0n,
 *   number: 1n,
 *   gasLimit: 30000000n,
 *   gasUsed: 0n,
 *   timestamp: 1764798551n,
 *   extraData: new Uint8Array(0),
 *   mixHash: zeroHash,
 *   nonce: new Uint8Array(8),
 *   baseFeePerGas: 7n,
 *   withdrawalsRoot: zeroHash,
 *   blobGasUsed: 0n,
 *   excessBlobGas: 0n,
 *   parentBeaconBlockRoot: zeroHash,
 *   requestsHash: "0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
 * });
 * ```
 */
export function from({
	parentHash,
	ommersHash,
	beneficiary,
	stateRoot,
	transactionsRoot,
	receiptsRoot,
	logsBloom,
	difficulty,
	number,
	gasLimit,
	gasUsed,
	timestamp,
	extraData,
	mixHash,
	nonce,
	baseFeePerGas,
	withdrawalsRoot,
	blobGasUsed,
	excessBlobGas,
	parentBeaconBlockRoot,
	requestsHash,
	blockAccessListHash,
}) {
	return /** @type {import('./BlockHeaderType.js').BlockHeaderType} */ ({
		parentHash: blockHashFrom(parentHash),
		ommersHash: hashFrom(ommersHash),
		beneficiary: addressFrom(beneficiary),
		stateRoot: hashFrom(stateRoot),
		transactionsRoot: hashFrom(transactionsRoot),
		receiptsRoot: hashFrom(receiptsRoot),
		logsBloom,
		difficulty: uint256From(difficulty),
		number: blockNumberFrom(number),
		gasLimit: uint256From(gasLimit),
		gasUsed: uint256From(gasUsed),
		timestamp: uint256From(timestamp),
		extraData,
		mixHash: hashFrom(mixHash),
		nonce,
		...(baseFeePerGas != null && {
			baseFeePerGas: uint256From(baseFeePerGas),
		}),
		...(withdrawalsRoot != null && {
			withdrawalsRoot: hashFrom(withdrawalsRoot),
		}),
		...(blobGasUsed != null && { blobGasUsed: uint256From(blobGasUsed) }),
		...(excessBlobGas != null && {
			excessBlobGas: uint256From(excessBlobGas),
		}),
		...(parentBeaconBlockRoot != null && {
			parentBeaconBlockRoot: hashFrom(parentBeaconBlockRoot),
		}),
		...(requestsHash != null && { requestsHash: hashFrom(requestsHash) }),
		...(blockAccessListHash != null && {
			blockAccessListHash: hashFrom(blockAccessListHash),
		}),
	});
}
