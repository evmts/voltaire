import { KZG_COMMITMENT_SIZE, MAX_UINT64 } from "./constants.js";
import { InvalidExecutionPayloadBidError } from "./errors.js";
import { toFixedBytes } from "./toFixedBytes.js";

/**
 * @param {unknown} value
 * @param {string} field
 * @returns {bigint}
 */
function uint64(value, field) {
	/** @type {bigint | undefined} */
	let n;
	if (typeof value === "bigint") {
		n = value;
	} else if (typeof value === "number" && Number.isSafeInteger(value)) {
		n = BigInt(value);
	} else if (typeof value === "string" && value.trim() !== "") {
		try {
			n = BigInt(value);
		} catch {
			n = undefined;
		}
	}
	if (n === undefined || n < 0n || n > MAX_UINT64) {
		throw new InvalidExecutionPayloadBidError(`${field} must be a uint64`, {
			value,
			expected: "uint64 as bigint, safe integer, or numeric string",
			context: { field },
		});
	}
	return n;
}

/**
 * Create an EIP-7732 (ePBS) `ExecutionPayloadBid`.
 *
 * Normalizes hex strings to bytes and quantities to bigint, and checks every
 * field's length or uint64 range. It does not verify the bid against a
 * payload or a signature.
 *
 * @see https://eips.ethereum.org/EIPS/eip-7732
 * @param {import('./ExecutionPayloadBidType.js').ExecutionPayloadBidLike} bid
 * @returns {import('./ExecutionPayloadBidType.js').ExecutionPayloadBidType}
 * @throws {InvalidExecutionPayloadBidError} If a field is missing, the wrong length, or out of range
 * @example
 * ```javascript
 * import { ExecutionPayloadBid } from "@tevm/voltaire";
 *
 * const zero32 = `0x${"00".repeat(32)}`;
 * const bid = ExecutionPayloadBid.from({
 *   parentBlockHash: zero32,
 *   parentBlockRoot: zero32,
 *   blockHash: zero32,
 *   prevRandao: zero32,
 *   feeRecipient: `0x${"00".repeat(20)}`,
 *   gasLimit: 60000000n,
 *   builderIndex: 7n,
 *   slot: 13164544n,
 *   value: 1000000000n,
 *   executionPayment: 0n,
 *   blobKzgCommitments: [],
 *   executionRequestsRoot: zero32,
 * });
 * ```
 */
export function from(bid) {
	if (bid === null || typeof bid !== "object") {
		throw new InvalidExecutionPayloadBidError(
			"execution payload bid must be an object",
			{ value: bid },
		);
	}
	const commitments = bid.blobKzgCommitments;
	if (!Array.isArray(commitments)) {
		throw new InvalidExecutionPayloadBidError(
			"blobKzgCommitments must be an array",
			{
				value: commitments,
				context: { field: "blobKzgCommitments" },
			},
		);
	}
	const blobKzgCommitments = [];
	for (let i = 0; i < commitments.length; i++) {
		blobKzgCommitments.push(
			toFixedBytes(
				commitments[i],
				KZG_COMMITMENT_SIZE,
				`blobKzgCommitments[${i}]`,
			),
		);
	}
	const normalized = {
		parentBlockHash: toFixedBytes(bid.parentBlockHash, 32, "parentBlockHash"),
		parentBlockRoot: toFixedBytes(bid.parentBlockRoot, 32, "parentBlockRoot"),
		blockHash: toFixedBytes(bid.blockHash, 32, "blockHash"),
		prevRandao: toFixedBytes(bid.prevRandao, 32, "prevRandao"),
		feeRecipient: toFixedBytes(bid.feeRecipient, 20, "feeRecipient"),
		gasLimit: uint64(bid.gasLimit, "gasLimit"),
		builderIndex: uint64(bid.builderIndex, "builderIndex"),
		slot: uint64(bid.slot, "slot"),
		value: uint64(bid.value, "value"),
		executionPayment: uint64(bid.executionPayment, "executionPayment"),
		blobKzgCommitments,
		executionRequestsRoot: toFixedBytes(
			bid.executionRequestsRoot,
			32,
			"executionRequestsRoot",
		),
	};
	// Lengths and ranges are checked above, so the brands hold.
	return /** @type {import('./ExecutionPayloadBidType.js').ExecutionPayloadBidType} */ (
		/** @type {unknown} */ (normalized)
	);
}
