// Export type definition
export type { BrandedEther } from "./BrandedEther.js";

// Export constants
export { WEI_PER_ETHER, GWEI_PER_ETHER } from "./constants.js";

// Import all functions
import { from } from "./from.js";
import { fromWei } from "./fromWei.js";
import { fromGwei } from "./fromGwei.js";
import { toWei } from "./toWei.js";
import { toGwei } from "./toGwei.js";
import { toU256 } from "./toU256.js";

// Export individually (tree-shakeable)
export { from, fromWei, fromGwei, toWei, toGwei, toU256 };

// Export as namespace (convenience)
export const BrandedEther = {
	from,
	fromWei,
	fromGwei,
	toWei,
	toGwei,
	toU256,
};
