// @ts-nocheck
import * as BrandedFunction from "./BrandedFunction/index.js";

/**
 * @typedef {import('./BrandedFunction/BrandedFunction.js').Function} BrandedFunction
 */

/**
 * Factory function for creating/validating Function ABI items
 * Since Function items are plain objects, this mainly serves as a namespace
 *
 * @template {string} TName
 * @template {import('./BrandedFunction/statemutability.js').StateMutability} TStateMutability
 * @template {readonly import('../Parameter.js').Parameter[]} TInputs
 * @template {readonly import('../Parameter.js').Parameter[]} TOutputs
 * @param {import('./BrandedFunction/BrandedFunction.js').Function<TName, TStateMutability, TInputs, TOutputs>} fn - Function ABI item
 * @returns {import('./BrandedFunction/BrandedFunction.js').Function<TName, TStateMutability, TInputs, TOutputs>} Validated function item
 */
export function Function(fn) {
	return fn;
}

// Static methods delegate to BrandedFunction namespace
Function.getSelector = BrandedFunction.getSelector;
Function.getSignature = BrandedFunction.getSignature;
Function.encodeParams = BrandedFunction.encodeParams;
Function.decodeParams = BrandedFunction.decodeParams;
Function.encodeResult = BrandedFunction.encodeResult;
Function.decodeResult = BrandedFunction.decodeResult;
