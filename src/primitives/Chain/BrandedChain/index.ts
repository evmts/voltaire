// @ts-nocheck
export * from "@tevm/chains";

import { byId } from "./byId.js";
import { from } from "./from.js";
import { fromId } from "./fromId.js";

// Export individual functions
export { from, fromId, byId };

// Namespace export
export const BrandedChain = {
	from,
	fromId,
	byId,
};
