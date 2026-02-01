import type { brand } from "../../brand.js";
/**
 * MultiTokenId type - ERC-1155 token type identifier
 *
 * @see https://voltaire.tevm.sh/primitives/multi-token-id for MultiTokenId documentation
 * @see https://eips.ethereum.org/EIPS/eip-1155 for ERC-1155 specification
 * @since 0.0.0
 */
export type MultiTokenIdType = bigint & {
    readonly [brand]: "MultiTokenId";
};
//# sourceMappingURL=MultiTokenIdType.d.ts.map