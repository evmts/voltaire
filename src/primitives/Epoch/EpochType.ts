import type { brand } from "../../brand.js";

/**
 * Epoch type
 *
 * Represents a consensus layer epoch (32 slots = 6.4 minutes).
 * Epochs are used for validator duties, finality, and checkpoint organization.
 *
 * @see https://voltaire.tevm.sh/primitives/epoch for Epoch documentation
 * @see https://github.com/ethereum/consensus-specs for Consensus specifications
 * @since 0.0.0
 */
export type EpochType = bigint & { readonly [brand]: "Epoch" };
