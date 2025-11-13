import type { brand } from "../../../brand.js";

/**
 * Branded Int256 type (critical for EVM signed operations)
 *
 * @see https://voltaire.tevm.sh/primitives/int256 for Int256 documentation
 * @since 0.0.0
 */
export type BrandedInt256 = bigint & { readonly [brand]: "Int256" };
