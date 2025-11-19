import type { brand } from "../../brand.js";

/**
 * BundleHash type
 *
 * Unique identifier for a transaction bundle. Computed as keccak256 of the
 * bundle contents (concatenated transaction hashes). Used to track bundle
 * status through MEV relays and block builders.
 *
 * @see https://voltaire.tevm.sh/primitives/bundle-hash for BundleHash documentation
 * @see https://docs.flashbots.net/flashbots-auction/overview for Flashbots Auction
 * @since 0.0.0
 */
export type BundleHashType = Uint8Array & {
	readonly [brand]: "BundleHash";
	readonly length: 32;
};

/**
 * Inputs that can be converted to BundleHash
 */
export type BundleHashLike = BundleHashType | string | Uint8Array;

export const SIZE = 32;
