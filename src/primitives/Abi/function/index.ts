import { Function } from "./Function.js";

// Re-export FunctionType and types
export type { FunctionType } from "./FunctionType.js";
export type { ExtractNames, Get } from "./FunctionType.js";
export * from "./errors.js";
export * from "./statemutability.js";

// Import crypto dependencies
import { keccak256String as keccak256StringImpl } from "../../Hash/BrandedHashIndex.js";

import { decodeParams as _decodeParams } from "./decodeParams.js";
import { decodeResult as _decodeResult } from "./decodeResult.js";
import { encodeParams as _encodeParams } from "./encodeParams.js";
import { encodeResult as _encodeResult } from "./encodeResult.js";
import { GetSelector } from "./getSelector.js";
import { getSignature as _getSignature } from "./getSignature.js";

// Factory export (tree-shakeable)
export { GetSelector };

// Wrapper export (convenient, backward compat)
export const getSelector = GetSelector({
	keccak256String: keccak256StringImpl,
});

// Export individual functions
export const getSignature = _getSignature;
export const encodeParams = _encodeParams;
export const decodeParams = _decodeParams;
export const encodeResult = _encodeResult;
export const decodeResult = _decodeResult;

// Constructor-style aliases (data-first pattern)
export { getSignature as Signature };
export { encodeParams as Params };
export { decodeParams as DecodeParams };
export { encodeResult as Result };
export { decodeResult as DecodeResult };

// Also export the Function factory itself
export { Function };
