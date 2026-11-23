import { BLS_SIGNATURE_SIZE } from "./constants.js";
import { InvalidExecutionPayloadBidError } from "./errors.js";
import { from } from "./from.js";
import { toFixedBytes } from "./toFixedBytes.js";

/**
 * Create an EIP-7732 (ePBS) `SignedExecutionPayloadBid`.
 *
 * Normalizes the bid with `from` and checks that the signature is 96 bytes.
 * It does not verify the BLS signature.
 *
 * @see https://eips.ethereum.org/EIPS/eip-7732
 * @param {import('./ExecutionPayloadBidType.js').SignedExecutionPayloadBidLike} signed
 * @returns {import('./ExecutionPayloadBidType.js').SignedExecutionPayloadBidType}
 * @throws {InvalidExecutionPayloadBidError} If the bid or signature is malformed
 * @example
 * ```javascript
 * import { ExecutionPayloadBid } from "@tevm/voltaire";
 *
 * const signed = ExecutionPayloadBid.fromSigned({
 *   message: bid,
 *   signature: `0x${"00".repeat(96)}`,
 * });
 * ```
 */
export function fromSigned(signed) {
	if (signed === null || typeof signed !== "object") {
		throw new InvalidExecutionPayloadBidError(
			"signed execution payload bid must be an object",
			{ value: signed },
		);
	}
	return {
		message: from(signed.message),
		signature: toFixedBytes(signed.signature, BLS_SIGNATURE_SIZE, "signature"),
	};
}
