import type { brand } from "../../../brand.js";
import type { Uint256Type } from "../../Uint/Uint256Type.js";

/**
 * Branded GasPrice type - prevents gas parameter confusion
 * Variable-length Uint8Array representing gas price in wei per gas unit
 */
export type BrandedGasPrice = Uint256Type & { readonly [brand]: "GasPrice" };
