import type { brand } from "../../brand.js";

/**
 * Branded GasPrice type - prevents gas parameter confusion
 * Represents gas price in wei per gas unit as a branded bigint
 */
export type GasPriceType = bigint & { readonly [brand]: "GasPrice" };
