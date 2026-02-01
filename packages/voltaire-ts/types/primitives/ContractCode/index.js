import { equals as _equals } from "./equals.js";
import { extractRuntime as _extractRuntime } from "./extractRuntime.js";
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { hasMetadata as _hasMetadata } from "./hasMetadata.js";
import { stripMetadata as _stripMetadata } from "./stripMetadata.js";
import { toHex as _toHex } from "./toHex.js";
// Export internal functions
export { _equals, _extractRuntime, _hasMetadata, _stripMetadata, _toHex };
// Export factory functions
export { from, fromHex };
// Wrapper exports
export function equals(a, b) {
    return _equals(from(a), from(b));
}
export function toHex(value) {
    return _toHex(from(value));
}
export function hasMetadata(value) {
    return _hasMetadata(from(value));
}
export function stripMetadata(value) {
    return _stripMetadata(from(value));
}
export function extractRuntime(value) {
    return _extractRuntime(from(value));
}
