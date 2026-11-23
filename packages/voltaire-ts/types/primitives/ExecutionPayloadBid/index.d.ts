export type { BuilderIndex, ExecutionPayloadBidLike, ExecutionPayloadBidType, SignedExecutionPayloadBidLike, SignedExecutionPayloadBidType, } from "./ExecutionPayloadBidType.js";
import type { ExecutionPayloadBidLike, ExecutionPayloadBidType, SignedExecutionPayloadBidLike, SignedExecutionPayloadBidType } from "./ExecutionPayloadBidType.js";
import { from as _from } from "./from.js";
import { fromSigned as _fromSigned } from "./fromSigned.js";
export { BLS_SIGNATURE_SIZE, BUILDER_INDEX_SELF_BUILD, DOMAIN_BEACON_BUILDER, KZG_COMMITMENT_SIZE, } from "./constants.js";
export { InvalidExecutionPayloadBidError } from "./errors.js";
export { _from, _fromSigned };
/** Create an EIP-7732 `ExecutionPayloadBid`; checks lengths and uint64 ranges. */
export declare function from(bid: ExecutionPayloadBidLike): ExecutionPayloadBidType;
/** Create an EIP-7732 `SignedExecutionPayloadBid`; does not verify the signature. */
export declare function fromSigned(signed: SignedExecutionPayloadBidLike): SignedExecutionPayloadBidType;
export declare const ExecutionPayloadBid: {
    from: typeof from;
    fromSigned: typeof fromSigned;
};
//# sourceMappingURL=index.d.ts.map