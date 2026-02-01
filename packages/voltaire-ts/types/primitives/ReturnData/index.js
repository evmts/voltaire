import { equals as _equals } from "./equals.js";
import { from as _from } from "./from.js";
import { fromBytes as _fromBytes } from "./fromBytes.js";
import { fromHex as _fromHex } from "./fromHex.js";
import { isEmpty as _isEmpty } from "./isEmpty.js";
import { toBytes as _toBytes } from "./toBytes.js";
import { toHex as _toHex } from "./toHex.js";
export * from "./errors.js";
/**
 * Create ReturnData from various input types
 */
export function from(value) {
    return _from(value);
}
/**
 * Create ReturnData from hex string
 */
export function fromHex(value) {
    return _fromHex(value);
}
/**
 * Create ReturnData from Uint8Array
 */
export function fromBytes(value) {
    return _fromBytes(value);
}
/**
 * Convert ReturnData to hex string
 */
export function toHex(data) {
    return _toHex(data);
}
/**
 * Convert ReturnData to plain Uint8Array
 */
export function toBytes(data) {
    return _toBytes(data);
}
/**
 * Check if two ReturnData instances are equal
 */
export function equals(a, b) {
    return _equals(a, b);
}
/**
 * Check if ReturnData is empty
 */
export function isEmpty(data) {
    return _isEmpty(data);
}
/**
 * Internal exports for advanced usage
 */
export { _from, _fromHex, _fromBytes, _toHex, _toBytes, _equals, _isEmpty };
