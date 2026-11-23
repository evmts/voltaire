export * from "./Chain.js";

import { byId } from "./byId.js";
import { from } from "./from.js";
import { fromId } from "./fromId.js";

// Export individual functions (public API)
// Export internal functions (tree-shakeable)
export { byId, byId as _byId, from, from as _from, fromId, fromId as _fromId };

// Namespace export
export const BrandedChain = {
	from,
	fromId,
	byId,
};
