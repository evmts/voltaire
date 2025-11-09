import * as Uint from "../../Uint/index.js";
import type { BrandedGasLimit } from "./BrandedGasLimit.js";

// Common gas limits
export const SIMPLE_TRANSFER = Uint.from(21000) as BrandedGasLimit;
export const ERC20_TRANSFER = Uint.from(65000) as BrandedGasLimit;
export const DEFAULT_LIMIT = Uint.from(30000000) as BrandedGasLimit;
