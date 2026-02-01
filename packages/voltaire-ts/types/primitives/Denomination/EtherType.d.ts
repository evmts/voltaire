import type { brand } from "../../brand.js";
/**
 * Branded Ether type - represents Ethereum amounts in ether (10^18 wei)
 *
 * Uses string to support decimal values like "1.5" or "0.001"
 * For whole number wei amounts, use WeiType (bigint)
 */
export type EtherType = string & {
    readonly [brand]: "Ether";
};
export type BrandedEther = EtherType;
//# sourceMappingURL=EtherType.d.ts.map