import { equals as _equals } from "./equals.js";
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { toHex as _toHex } from "./toHex.js";
// Export internal functions
export { _equals, _toHex };
// Export factory functions
export { from, fromHex };
// Wrapper exports
export function equals(a, b) {
    return _equals(from(a), from(b));
}
export function toHex(value) {
    return _toHex(from(value));
}
