import type { AddressType } from "../Address/AddressType.js";
import type { HashType } from "../Hash/HashType.js";
import type { SlotType } from "../Slot/SlotType.js";
import type { Uint256Type } from "../Uint/Uint256Type.js";

/**
 * BuilderBid type
 *
 * Represents a block builder bid in Proposer-Builder Separation (PBS).
 * Block builders compete to provide the most valuable block to validators
 * through MEV-Boost relays. The bid includes the proposed block details,
 * value offered to the proposer, and cryptographic signatures.
 *
 * @see https://voltaire.tevm.sh/primitives/builder-bid for BuilderBid documentation
 * @see https://boost.flashbots.net/ for MEV-Boost
 * @see https://ethereum.org/en/roadmap/pbs/ for PBS overview
 * @since 0.0.0
 */
export type BuilderBidType = {
	/**
	 * Beacon chain slot number for this bid
	 * Each slot is 12 seconds
	 */
	readonly slot: SlotType;

	/**
	 * Parent block hash
	 * The block being built on top of
	 */
	readonly parentHash: HashType;

	/**
	 * Proposed block hash
	 * Hash of the block being bid on
	 */
	readonly blockHash: HashType;

	/**
	 * Builder's BLS public key (48 bytes)
	 * Identity of the block builder
	 */
	readonly builderPubkey: Uint8Array;

	/**
	 * Proposer's BLS public key (48 bytes)
	 * Identity of the validator proposing this slot
	 */
	readonly proposerPubkey: Uint8Array;

	/**
	 * Fee recipient address
	 * Where block rewards and tips are sent
	 */
	readonly proposerFeeRecipient: AddressType;

	/**
	 * Block gas limit
	 * Maximum gas allowed in the proposed block
	 */
	readonly gasLimit: Uint256Type;

	/**
	 * Gas used in block
	 * Actual gas consumed by transactions
	 */
	readonly gasUsed: Uint256Type;

	/**
	 * Bid value to proposer (in wei)
	 * Amount builder pays validator for block inclusion
	 */
	readonly value: Uint256Type;

	/**
	 * Builder's BLS signature (96 bytes)
	 * Cryptographic proof of bid authenticity
	 */
	readonly signature: Uint8Array;
};

/**
 * Inputs that can be converted to BuilderBid
 */
export type BuilderBidLike =
	| BuilderBidType
	| {
			slot: SlotType | bigint | number | string;
			parentHash: HashType | string | Uint8Array;
			blockHash: HashType | string | Uint8Array;
			builderPubkey: Uint8Array | string;
			proposerPubkey: Uint8Array | string;
			proposerFeeRecipient: AddressType | string;
			gasLimit: Uint256Type | bigint | number | string;
			gasUsed: Uint256Type | bigint | number | string;
			value: Uint256Type | bigint | number | string;
			signature: Uint8Array | string;
	  };

/**
 * BuilderBid with hex strings (common in RPC responses)
 */
export type BuilderBidHex = {
	readonly slot: string;
	readonly parent_hash: string;
	readonly block_hash: string;
	readonly builder_pubkey: string;
	readonly proposer_pubkey: string;
	readonly proposer_fee_recipient: string;
	readonly gas_limit: string;
	readonly gas_used: string;
	readonly value: string;
	readonly signature: string;
};
