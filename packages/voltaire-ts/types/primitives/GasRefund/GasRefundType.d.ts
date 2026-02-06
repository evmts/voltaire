import type { brand } from "../../brand.js";
/**
 * Branded GasRefund type - gas refunded after transaction
 * Sources: SSTORE refunds, SELFDESTRUCT refunds (pre-London)
 * Post-London (EIP-3529): Capped at gasUsed / 5
 */
export type GasRefundType = bigint & {
    readonly [brand]: "GasRefund";
};
//# sourceMappingURL=GasRefundType.d.ts.map