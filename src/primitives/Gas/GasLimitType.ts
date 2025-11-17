import type { brand } from "../../brand.js";
import type { Uint256Type } from "../Uint/Uint256Type.js";

/**
 * Branded GasLimit type - prevents gas parameter confusion
 * Variable-length Uint8Array representing maximum gas units for a transaction
 */
export type GasLimitType = Uint256Type & { readonly [brand]: "GasLimit" };
