import { equals as _equals } from "./equals.js";
// Import all functions
import { from } from "./from.js";
import { parse as _parse } from "./parse.js";
import { toString as _toString } from "./toString.js";
// Export constructors
export { from };
// Export public wrapper functions
// biome-ignore lint/suspicious/noShadowRestrictedNames: intentional override for branded type conversion
export function toString(peerId) {
    return _toString.call(from(peerId));
}
export function equals(peerId1, peerId2) {
    return _equals.call(from(peerId1), from(peerId2));
}
export function parse(peerId) {
    return _parse.call(from(peerId));
}
// Export internal functions (tree-shakeable)
export { _toString, _equals, _parse };
// Export as namespace (convenience)
export const PeerId = {
    from,
    toString,
    equals,
    parse,
};
