// Import all functions
import { compare as _compare } from "./compare.js";
import { from } from "./from.js";
import { getMajor as _getMajor } from "./getMajor.js";
import { getMinor as _getMinor } from "./getMinor.js";
import { getPatch as _getPatch } from "./getPatch.js";
import { isCompatible as _isCompatible } from "./isCompatible.js";
import { parse as _parse } from "./parse.js";
// Export constructors
export { from };
// Export public wrapper functions
export function parse(version) {
    return _parse(from(version));
}
export function compare(a, b) {
    return _compare(from(a), from(b));
}
export function getMajor(version) {
    return _getMajor(from(version));
}
export function getMinor(version) {
    return _getMinor(from(version));
}
export function getPatch(version) {
    return _getPatch(from(version));
}
export function isCompatible(version, range) {
    return _isCompatible(from(version), range);
}
// Export internal functions (tree-shakeable)
export { _parse, _compare, _getMajor, _getMinor, _getPatch, _isCompatible };
// Export as namespace (convenience)
export const CompilerVersion = {
    from,
    parse,
    compare,
    getMajor,
    getMinor,
    getPatch,
    isCompatible,
};
