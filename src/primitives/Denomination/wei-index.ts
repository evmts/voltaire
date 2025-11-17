// Export type definition
export type { BrandedWei, WeiType } from "./WeiType.js";

// Export constants
export { WEI_PER_GWEI, WEI_PER_ETHER } from "./wei-constants.js";

// Import all functions
import { from } from "./wei-from.js";
import { fromEther } from "./wei-fromEther.js";
import { fromGwei } from "./wei-fromGwei.js";
import { toEther } from "./wei-toEther.js";
import { toGwei } from "./wei-toGwei.js";
import { toU256 } from "./wei-toU256.js";

// Export individually (tree-shakeable)
export { from, fromEther, fromGwei, toEther, toGwei, toU256 };

// Export as namespace (convenience)
export const Wei = {
	from,
	fromEther,
	fromGwei,
	toEther,
	toGwei,
	toU256,
};
