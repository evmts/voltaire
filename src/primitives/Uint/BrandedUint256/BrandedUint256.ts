import type { brand } from "../../../brand.js";

/**
 * Branded Uint256 type
 *
 * @see https://voltaire.tevm.sh/primitives/uint256 for Uint256 documentation
 * @since 0.0.0
 */
export type BrandedUint256 = bigint & { readonly [brand]: "Uint256" };

/**
 * @deprecated Use BrandedUint256 instead
 */
export type BrandedUint = BrandedUint256;
