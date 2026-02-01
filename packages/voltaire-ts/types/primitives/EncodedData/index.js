import { equals as _equals } from "./equals.js";
import { from as _from } from "./from.js";
import { fromBytes as _fromBytes } from "./fromBytes.js";
import { toBytes as _toBytes } from "./toBytes.js";
export * from "./errors.js";
/**
 * Create EncodedData from various input types
 */
export function from(value) {
    return _from(value);
}
/**
 * Create EncodedData from Uint8Array
 */
export function fromBytes(value) {
    return _fromBytes(value);
}
/**
 * Convert EncodedData to Uint8Array
 */
export function toBytes(data) {
    return _toBytes(data);
}
/**
 * Check if two EncodedData instances are equal
 */
export function equals(a, b) {
    return _equals(a, b);
}
/**
 * Internal exports for advanced usage
 */
export { _from, _fromBytes, _toBytes, _equals };
