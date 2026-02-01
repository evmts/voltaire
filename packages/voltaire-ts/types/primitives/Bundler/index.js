// Import all functions
import { equals as _equals } from "./equals.js";
import { from } from "./from.js";
import { toHex as _toHex } from "./toHex.js";
// Export constructors
export { from };
// Export public wrapper functions
export function toHex(bundler) {
    return _toHex(from(bundler));
}
export function equals(bundler1, bundler2) {
    return _equals(from(bundler1), from(bundler2));
}
// Export internal functions (tree-shakeable)
export { _toHex, _equals };
// Export as namespace (convenience)
export const Bundler = {
    from,
    toHex,
    equals,
};
