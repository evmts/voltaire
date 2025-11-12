import type { brand } from "../../../brand.js";

/**
 * Branded Uint256 type
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 */
export type BrandedUint = bigint & { readonly [brand]: "Uint256" };
