// @ts-nocheck
export * from "./FunctionSignatureType.js";

import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromSignature } from "./fromSignature.js";
import { parseSignature } from "./parseSignature.js";
import { toHex } from "./toHex.js";

// Export individual functions
export { from, fromSignature, toHex, equals, parseSignature };

// Namespace export
export const FunctionSignature = {
	from,
	fromSignature,
	toHex,
	equals,
	parseSignature,
};
