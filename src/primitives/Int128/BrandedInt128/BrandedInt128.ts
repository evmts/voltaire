import type { brand } from "../../../brand.js";

/**
 * Branded Int128 type
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 */
export type BrandedInt128 = bigint & { readonly [brand]: "Int128" };
