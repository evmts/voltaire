import type { brand } from "../../brand.js";

/**
 * Uint128 type
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 */
export type Uint128Type = bigint & { readonly [brand]: "Uint128" };
