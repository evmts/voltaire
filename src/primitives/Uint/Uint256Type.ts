import type { brand } from "../../../brand.js";

/**
 * Uint256 type
 *
 * @see https://voltaire.tevm.sh/primitives/uint256 for Uint256 documentation
 * @since 0.0.0
 */
export type Uint256Type = bigint & { readonly [brand]: "Uint256" };

/**
 * @deprecated Use Uint256Type instead
 */
export type BrandedUint256 = Uint256Type;

/**
 * @deprecated Use Uint256Type instead
 */
export type BrandedUint = Uint256Type;
