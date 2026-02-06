import type { brand } from "../../brand.js";
/**
 * TokenBalance type - ERC-20 token balance
 *
 * @see https://voltaire.tevm.sh/primitives/token-balance for TokenBalance documentation
 * @see https://eips.ethereum.org/EIPS/eip-20 for ERC-20 specification
 * @since 0.0.0
 */
export type TokenBalanceType = bigint & {
    readonly [brand]: "TokenBalance";
};
//# sourceMappingURL=TokenBalanceType.d.ts.map