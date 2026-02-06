export { SIZE } from "./ErrorSignatureType.js";
import { equals as _equals } from "./equals.js";
import { from as _from } from "./from.js";
import { fromHex as _fromHex } from "./fromHex.js";
import { fromSignature as _fromSignature } from "./fromSignature.js";
import { toHex as _toHex } from "./toHex.js";
/**
 * Create ErrorSignature from various input types
 */
export function from(value) {
    return _from(value);
}
/**
 * Create ErrorSignature from hex string
 */
export function fromHex(hex) {
    return _fromHex(hex);
}
/**
 * Compute ErrorSignature from error signature string
 */
export function fromSignature(signature) {
    return _fromSignature(signature);
}
/**
 * Convert ErrorSignature to hex string
 */
export function toHex(signature) {
    return _toHex(signature);
}
/**
 * Check if two ErrorSignatures are equal
 */
export function equals(a, b) {
    return _equals(a, b);
}
// Namespace export
export const ErrorSignature = {
    from,
    fromHex,
    fromSignature,
    toHex,
    equals,
};
