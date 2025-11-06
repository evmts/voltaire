// @ts-nocheck
export * from "./BrandedParameter.js";

import { decode } from "./decode.js";
import { encode } from "./encode.js";
import { from } from "./from.js";

// Export individual functions
export { decode, encode, from };

// Namespace export
export const BrandedParameter = {
	from,
	encode,
	decode,
};
