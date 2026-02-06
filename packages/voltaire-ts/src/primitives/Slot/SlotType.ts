import type { brand } from "../../brand.js";

/**
 * Slot type
 *
 * Represents a consensus layer slot number (12 seconds per slot).
 * Slots are the fundamental unit of time in Ethereum's proof-of-stake consensus.
 *
 * @see https://voltaire.tevm.sh/primitives/slot for Slot documentation
 * @see https://github.com/ethereum/consensus-specs for Consensus specifications
 * @since 0.0.0
 */
export type SlotType = bigint & { readonly [brand]: "Slot" };
