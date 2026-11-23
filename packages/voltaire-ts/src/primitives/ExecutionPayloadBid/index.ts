// Export types
export type {
	BuilderIndex,
	ExecutionPayloadBidLike,
	ExecutionPayloadBidType,
	SignedExecutionPayloadBidLike,
	SignedExecutionPayloadBidType,
} from "./ExecutionPayloadBidType.js";

import type {
	ExecutionPayloadBidLike,
	ExecutionPayloadBidType,
	SignedExecutionPayloadBidLike,
	SignedExecutionPayloadBidType,
} from "./ExecutionPayloadBidType.js";
import { from as _from } from "./from.js";
import { fromSigned as _fromSigned } from "./fromSigned.js";

export {
	BLS_SIGNATURE_SIZE,
	BUILDER_INDEX_SELF_BUILD,
	DOMAIN_BEACON_BUILDER,
	KZG_COMMITMENT_SIZE,
} from "./constants.js";
export { InvalidExecutionPayloadBidError } from "./errors.js";

// Export internal functions (tree-shakeable)
export { _from, _fromSigned };

/** Create an EIP-7732 `ExecutionPayloadBid`; checks lengths and uint64 ranges. */
export function from(bid: ExecutionPayloadBidLike): ExecutionPayloadBidType {
	return _from(bid);
}

/** Create an EIP-7732 `SignedExecutionPayloadBid`; does not verify the signature. */
export function fromSigned(
	signed: SignedExecutionPayloadBidLike,
): SignedExecutionPayloadBidType {
	return _fromSigned(signed);
}

// Namespace export
export const ExecutionPayloadBid = {
	from,
	fromSigned,
};
