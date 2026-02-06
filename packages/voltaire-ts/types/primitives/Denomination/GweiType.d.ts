import type { brand } from "../../brand.js";
/**
 * Branded Gwei type - represents Ethereum amounts in gwei (10^9 wei = 10^-9 ETH)
 *
 * Uses string to support decimal values like "1.5" or "0.001"
 * For whole number wei amounts, use WeiType (bigint)
 */
export type GweiType = string & {
    readonly [brand]: "Gwei";
};
export type BrandedGwei = GweiType;
//# sourceMappingURL=GweiType.d.ts.map