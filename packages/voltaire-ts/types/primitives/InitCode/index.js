import { equals as _equals } from "./equals.js";
import { estimateGas as _estimateGas } from "./estimateGas.js";
import { extractRuntime as _extractRuntime } from "./extractRuntime.js";
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { toHex as _toHex } from "./toHex.js";
// Export internal functions
export { _equals, _estimateGas, _extractRuntime, _toHex };
// Export factory functions
export { from, fromHex };
// Wrapper exports
export function equals(a, b) {
    return _equals(from(a), from(b));
}
export function toHex(value) {
    return _toHex(from(value));
}
export function extractRuntime(value, offset) {
    return _extractRuntime(from(value), offset);
}
export function estimateGas(value) {
    return _estimateGas(from(value));
}
