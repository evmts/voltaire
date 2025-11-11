/**
 * Branded Uint256 type
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 */
export type BrandedUint = bigint & { readonly __tag: "Uint256" };
