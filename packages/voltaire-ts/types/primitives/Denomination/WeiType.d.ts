import type { brand } from "../../brand.js";
/**
 * Branded Wei type - represents Ethereum amounts in wei (smallest unit: 10^-18 ETH)
 */
export type WeiType = bigint & {
    readonly [brand]: "Wei";
};
export type BrandedWei = WeiType;
//# sourceMappingURL=WeiType.d.ts.map