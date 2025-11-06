// @ts-nocheck
export * from "./errors.js";
export * from "./BrandedFunction.js";
export * from "./statemutability.js";

import { decodeParams } from "./decodeParams.js";
import { decodeResult } from "./decodeResult.js";
import { encodeParams } from "./encodeParams.js";
import { encodeResult } from "./encodeResult.js";
import { getSelector } from "./getSelector.js";
import { getSignature } from "./getSignature.js";

// Export individual functions
export {
	getSelector,
	getSignature,
	encodeParams,
	decodeParams,
	encodeResult,
	decodeResult,
};

// Namespace export
export const BrandedFunction = {
	getSelector,
	getSignature,
	encodeParams,
	decodeParams,
	encodeResult,
	decodeResult,
};
