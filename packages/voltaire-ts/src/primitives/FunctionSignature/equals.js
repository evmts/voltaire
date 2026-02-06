import * as Selector from "../Selector/index.js";

/**
 * Check if two FunctionSignatures are equal (by selector)
 *
 * @param {import('./FunctionSignatureType.js').FunctionSignatureType} a - First signature
 * @param {import('./FunctionSignatureType.js').FunctionSignatureType} b - Second signature
 * @returns {boolean} True if selectors are equal
 * @throws {never}
 * @example
 * ```javascript
 * import * as FunctionSignature from './primitives/FunctionSignature/index.js';
 * const equal = FunctionSignature.equals(sig1, sig2);
 * ```
 */
export function equals(a, b) {
	return Selector.equals(a.selector, b.selector);
}
