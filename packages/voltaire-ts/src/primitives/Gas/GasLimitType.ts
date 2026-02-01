import type { brand } from "../../brand.js";

/**
 * Branded GasLimit type - prevents gas parameter confusion
 * Represents maximum gas units for a transaction as a branded bigint
 */
export type GasLimitType = bigint & { readonly [brand]: "GasLimit" };
