import type { brand } from "../../brand.js";

/**
 * WithdrawalIndex type
 *
 * Represents the global withdrawal counter in the beacon chain (EIP-4895).
 * This counter increments monotonically for each withdrawal processed.
 *
 * @see https://voltaire.tevm.sh/primitives/withdrawal-index for WithdrawalIndex documentation
 * @see https://eips.ethereum.org/EIPS/eip-4895 for EIP-4895 specification
 * @since 0.0.0
 */
export type WithdrawalIndexType = bigint & {
	readonly [brand]: "WithdrawalIndex";
};
