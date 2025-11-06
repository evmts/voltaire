// Export type definition
export type { BrandedWei } from "./BrandedWei.js";

// Export constants
export { WEI_PER_GWEI, WEI_PER_ETHER } from "./constants.js";

// Import all functions
import { from } from "./from.js";
import { fromEther } from "./fromEther.js";
import { fromGwei } from "./fromGwei.js";
import { toEther } from "./toEther.js";
import { toGwei } from "./toGwei.js";
import { toU256 } from "./toU256.js";

// Export individually (tree-shakeable)
export { from, fromEther, fromGwei, toEther, toGwei, toU256 };

// Export as namespace (convenience)
export const BrandedWei = {
	from,
	fromEther,
	fromGwei,
	toEther,
	toGwei,
	toU256,
};
