import { from as addressFrom } from "../Address/internal-index.js";
import { from as blockHashFrom } from "../BlockHash/index.js";
import { from as blockNumberFrom } from "../BlockNumber/index.js";
import { from as hashFrom } from "../Hash/index.js";
import { from as uint256From } from "../Uint/index.js";

/**
 * Create Uncle from components
 *
 * @param {object} params - Uncle parameters
 * @returns {import('./UncleType.js').UncleType} Uncle
 *
 * @example
 * ```typescript
 * const uncle = Uncle.from({
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
 *   nonce: new Uint8Array(8)
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
}) {
	return {
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
}
