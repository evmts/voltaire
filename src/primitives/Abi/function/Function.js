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

/**
 * @typedef {import('./BrandedFunction.js').Function} BrandedFunction
 */

/**
 * Factory function for creating/validating Function ABI items
 * Since Function items are plain objects, this mainly serves as a namespace
 *
 * @template {string} TName
 * @template {import('./statemutability.js').StateMutability} TStateMutability
 * @template {readonly import('../Parameter.js').Parameter[]} TInputs
 * @template {readonly import('../Parameter.js').Parameter[]} TOutputs
 * @param {import('./BrandedFunction.js').Function<TName, TStateMutability, TInputs, TOutputs>} fn - Function ABI item
 * @returns {import('./BrandedFunction.js').Function<TName, TStateMutability, TInputs, TOutputs>} Validated function item
 */
export function Function(fn) {
	return fn;
}

Function.getSelector = getSelector;
Function.getSignature = getSignature;
Function.encodeParams = encodeParams;
Function.decodeParams = decodeParams;
Function.encodeResult = encodeResult;
Function.decodeResult = decodeResult;
