// @ts-nocheck
export * from "@tevm/chains";

import { byId } from "./byId.js";
import { from } from "./from.js";
import { fromId } from "./fromId.js";

// Export individual functions (public API)
export { from, fromId, byId };

// Export internal functions (tree-shakeable)
export { from as _from, fromId as _fromId, byId as _byId };

// Namespace export
export const BrandedChain = {
	from,
	fromId,
	byId,
};
