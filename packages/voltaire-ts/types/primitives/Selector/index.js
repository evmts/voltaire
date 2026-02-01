export * from "./SelectorType.js";
import { equals as _equals } from "./equals.js";
import { from as _from } from "./from.js";
import { fromHex as _fromHex } from "./fromHex.js";
import { fromSignature as _fromSignature } from "./fromSignature.js";
import { toHex as _toHex } from "./toHex.js";
/**
 * Create Selector from various input types
 */
export function from(value) {
    return _from(value);
}
/**
 * Create Selector from hex string
 */
export function fromHex(hex) {
    return _fromHex(hex);
}
/**
 * Compute Selector from function signature
 */
export function fromSignature(signature) {
    return _fromSignature(signature);
}
/**
 * Convert Selector to hex string
 */
export function toHex(selector) {
    return _toHex(selector);
}
/**
 * Check if two Selectors are equal
 */
export function equals(a, b) {
    return _equals(a, b);
}
// Namespace export
export const Selector = {
    from,
    fromHex,
    fromSignature,
    toHex,
    equals,
};
