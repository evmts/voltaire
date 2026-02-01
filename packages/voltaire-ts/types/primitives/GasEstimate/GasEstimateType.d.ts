import type { brand } from "../../brand.js";
/**
 * Branded GasEstimate type - estimated gas for transaction
 * Returned by eth_estimateGas RPC method
 * Should add buffer (20-30%) for actual transaction
 */
export type GasEstimateType = bigint & {
    readonly [brand]: "GasEstimate";
};
//# sourceMappingURL=GasEstimateType.d.ts.map