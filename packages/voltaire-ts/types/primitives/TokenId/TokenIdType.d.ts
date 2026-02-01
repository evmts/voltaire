import type { brand } from "../../brand.js";
/**
 * TokenId type - ERC-721 NFT token identifier
 *
 * @see https://voltaire.tevm.sh/primitives/token-id for TokenId documentation
 * @see https://eips.ethereum.org/EIPS/eip-721 for ERC-721 specification
 * @since 0.0.0
 */
export type TokenIdType = bigint & {
    readonly [brand]: "TokenId";
};
//# sourceMappingURL=TokenIdType.d.ts.map