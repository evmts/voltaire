// Export type definition
export type { BrandedGwei } from "./BrandedGwei.js";

// Export constants
export { WEI_PER_GWEI, GWEI_PER_ETHER } from "./constants.js";

// Import all functions
import { from } from "./from.js";
import { fromEther } from "./fromEther.js";
import { fromWei } from "./fromWei.js";
import { toEther } from "./toEther.js";
import { toWei } from "./toWei.js";
import { toU256 } from "./toU256.js";

// Export individually (tree-shakeable)
export { from, fromEther, fromWei, toEther, toWei, toU256 };

// Export as namespace (convenience)
export const BrandedGwei = {
	from,
	fromEther,
	fromWei,
	toEther,
	toWei,
	toU256,
};
