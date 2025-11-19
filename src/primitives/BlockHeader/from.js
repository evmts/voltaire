import { from as addressFrom } from "../Address/internal-index.js";
import { from as blockHashFrom } from "../BlockHash/index.js";
import { from as blockNumberFrom } from "../BlockNumber/index.js";
import { from as hashFrom } from "../Hash/index.js";
import { from as uint256From } from "../Uint/index.js";

/**
 * Create BlockHeader from components
 *
 * @param {object} params - BlockHeader parameters
 * @returns {import('./BlockHeaderType.js').BlockHeaderType} BlockHeader
 *
 * @example
 * ```typescript
 * const header = BlockHeader.from({
 *   parentHash: "0x1234...",
 *   ommersHash: "0x5678...",
 *   beneficiary: "0xabcd...",
 *   stateRoot: "0xef01...",
 *   transactionsRoot: "0x2345...",
 *   receiptsRoot: "0x6789...",
 *   logsBloom: new Uint8Array(256),
 *   difficulty: 0n,
 *   number: 12345n,
 *   gasLimit: 30000000n,
 *   gasUsed: 21000n,
 *   timestamp: 1234567890n,
 *   extraData: new Uint8Array(0),
 *   mixHash: "0xabcd...",
 *   nonce: new Uint8Array(8),
 *   baseFeePerGas: 1000000000n, // EIP-1559
 *   withdrawalsRoot: "0xdef0...", // Post-Shanghai
 *   blobGasUsed: 262144n, // EIP-4844
 *   excessBlobGas: 0n, // EIP-4844
 *   parentBeaconBlockRoot: "0x0123..." // EIP-4788
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
}) {
	/** @type {import('./BlockHeaderType.js').BlockHeaderType} */
	const header = {
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
	};

	// Optional post-London fields
	if (baseFeePerGas !== undefined) {
		header.baseFeePerGas = uint256From(baseFeePerGas);
	}

	// Optional post-Shanghai fields
	if (withdrawalsRoot !== undefined) {
		header.withdrawalsRoot = hashFrom(withdrawalsRoot);
	}

	// Optional post-Cancun fields (EIP-4844)
	if (blobGasUsed !== undefined) {
		header.blobGasUsed = uint256From(blobGasUsed);
	}

	if (excessBlobGas !== undefined) {
		header.excessBlobGas = uint256From(excessBlobGas);
	}

	// Optional post-Cancun fields (EIP-4788)
	if (parentBeaconBlockRoot !== undefined) {
		header.parentBeaconBlockRoot = hashFrom(parentBeaconBlockRoot);
	}

	return header;
}
