import type { brand } from "../../brand.js";

/**
 * Branded GasUsed type - actual gas consumed by transaction
 * Found in transaction receipts (receipt.gasUsed)
 * Range: 21000 (minimum transfer) to block gas limit (30M typical)
 */
export type GasUsedType = bigint & { readonly [brand]: "GasUsed" };
