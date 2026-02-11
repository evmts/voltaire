import * as Selector from "../Selector/index.js";

/**
 * Convert FunctionSignature selector to hex string
 *
 * @param {import('./FunctionSignatureType.js').FunctionSignatureType} functionSig - Function signature
 * @returns {import('../Hex/HexType.js').HexType} Hex string with 0x prefix
 * @throws {never}
 * @example
 * ```javascript
 * import * as FunctionSignature from './primitives/FunctionSignature/index.js';
 * const hex = FunctionSignature.toHex(sig);
 * // '0xa9059cbb'
 * ```
 */
export function toHex(functionSig) {
	return /** @type {import('../Hex/HexType.js').HexType} */ (
		Selector.toHex(functionSig.selector)
	);
}
