import * as Selector from "../Selector/index.js";
import { parseSignature } from "./parseSignature.js";
/**
 * Create FunctionSignature from various input types
 *
 * @param {import('./FunctionSignatureType.js').FunctionSignatureLike} value - Input value
 * @returns {import('./FunctionSignatureType.js').FunctionSignatureType} Function signature
 * @throws {Error} If input is invalid
 * @example
 * ```javascript
 * import * as FunctionSignature from './primitives/FunctionSignature/index.js';
 * const sig = FunctionSignature.from('transfer(address,uint256)');
 * ```
 */
export function from(value) {
    // Already a FunctionSignature
    if (typeof value === "object" &&
        value !== null &&
        "selector" in value &&
        "signature" in value) {
        return value;
    }
    // String signature
    if (typeof value === "string") {
        const { name, inputs } = parseSignature(value);
        const selector = Selector.fromSignature(value);
        return {
            selector,
            signature: value,
            name,
            inputs,
        };
    }
    // Selector - minimal signature without metadata
    if (value instanceof Uint8Array && value.length === 4) {
        const selector = 
        /** @type {import('../Selector/SelectorType.js').SelectorType} */ (value);
        return {
            selector,
            signature: Selector.toHex(selector),
            name: "",
            inputs: [],
        };
    }
    throw new Error(`Invalid function signature input: ${typeof value}`);
}
