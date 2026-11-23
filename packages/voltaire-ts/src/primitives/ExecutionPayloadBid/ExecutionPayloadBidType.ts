import type { AddressType } from "../Address/AddressType.js";
import type { BlockHashType } from "../BlockHash/BlockHashType.js";
import type { HashType } from "../Hash/HashType.js";
import type { SlotType } from "../Slot/SlotType.js";

/**
 * EIP-7732 `BuilderIndex` (uint64): index of a builder in the beacon builder
 * registry. `BUILDER_INDEX_SELF_BUILD` marks a proposer-built payload.
 */
export type BuilderIndex = bigint;

/**
 * EIP-7732 (ePBS) `ExecutionPayloadBid`.
 *
 * A builder's commitment to an execution payload. In Amsterdam the beacon
 * block carries this bid in place of the full payload; the builder later
 * reveals the payload, which the execution client receives as an
 * `ExecutionPayloadV4` through `engine_newPayloadV5`.
 *
 * `blockHash`, `prevRandao`, `feeRecipient`, and `gasLimit` commit to the
 * same-named `ExecutionPayloadV4` fields. `parentBlockHash` commits to its
 * `parentHash`.
 *
 * Field order follows the Gloas consensus-specs container. The container was
 * still changing when this type was recorded (2026-11).
 *
 * @see https://eips.ethereum.org/EIPS/eip-7732
 * @see https://github.com/ethereum/consensus-specs/blob/master/specs/gloas/beacon-chain.md
 */
export type ExecutionPayloadBidType = {
	/** Hash of the parent execution block (`ExecutionPayloadV4.parentHash`). */
	readonly parentBlockHash: BlockHashType;
	/** Hash tree root of the parent beacon block. */
	readonly parentBlockRoot: HashType;
	/** Hash of the committed execution block (`ExecutionPayloadV4.blockHash`). */
	readonly blockHash: BlockHashType;
	/** RANDAO mix the payload must use (`ExecutionPayloadV4.prevRandao`). */
	readonly prevRandao: HashType;
	/** Execution-layer fee recipient (`ExecutionPayloadV4.feeRecipient`). */
	readonly feeRecipient: AddressType;
	/** Block gas limit (uint64, `ExecutionPayloadV4.gasLimit`). */
	readonly gasLimit: bigint;
	/** Builder registry index (uint64). */
	readonly builderIndex: BuilderIndex;
	/** Beacon slot the bid is for. */
	readonly slot: SlotType;
	/** Payment to the proposer in Gwei (uint64), paid on the beacon chain. */
	readonly value: bigint;
	/** Payment to the proposer in Gwei (uint64), paid on the execution layer. */
	readonly executionPayment: bigint;
	/** KZG commitments (48 bytes each) of the payload's blobs. */
	readonly blobKzgCommitments: readonly Uint8Array[];
	/** Hash tree root of the payload's execution requests. */
	readonly executionRequestsRoot: HashType;
};

/**
 * EIP-7732 `SignedExecutionPayloadBid`: a bid with the builder's BLS
 * signature over it in the `DOMAIN_BEACON_BUILDER` domain.
 */
export type SignedExecutionPayloadBidType = {
	readonly message: ExecutionPayloadBidType;
	/** BLS12-381 signature (96 bytes). */
	readonly signature: Uint8Array;
};

type Quantity = bigint | number | string;
type BytesLike = Uint8Array | string;

/** Loose input accepted by `ExecutionPayloadBid.from`. */
export type ExecutionPayloadBidLike = {
	parentBlockHash: BytesLike;
	parentBlockRoot: BytesLike;
	blockHash: BytesLike;
	prevRandao: BytesLike;
	feeRecipient: BytesLike;
	gasLimit: Quantity;
	builderIndex: Quantity;
	slot: Quantity;
	value: Quantity;
	executionPayment: Quantity;
	blobKzgCommitments: readonly BytesLike[];
	executionRequestsRoot: BytesLike;
};

/** Loose input accepted by `ExecutionPayloadBid.fromSigned`. */
export type SignedExecutionPayloadBidLike = {
	message: ExecutionPayloadBidLike;
	signature: BytesLike;
};
