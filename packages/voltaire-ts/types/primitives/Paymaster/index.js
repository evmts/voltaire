// Import all functions
import { equals as _equals } from "./equals.js";
import { from } from "./from.js";
import { toHex as _toHex } from "./toHex.js";
// Export constructors
export { from };
// Export public wrapper functions
export function toHex(paymaster) {
    return _toHex(from(paymaster));
}
export function equals(paymaster1, paymaster2) {
    return _equals(from(paymaster1), from(paymaster2));
}
// Export internal functions (tree-shakeable)
export { _toHex, _equals };
// Export as namespace (convenience)
export const Paymaster = {
    from,
    toHex,
    equals,
};
