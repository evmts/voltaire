// Export type definition
// Export constants
export { COMMON_LICENSES, OSI_APPROVED_LICENSES, } from "./constants.js";
// Import all functions
import { COMMON_LICENSES, OSI_APPROVED_LICENSES } from "./constants.js";
import { from } from "./from.js";
import { isOSI as _isOSI } from "./isOSI.js";
import { toString as _toString } from "./toString.js";
// Export constructors
export { from };
// Export public wrapper functions
export function isOSI(license) {
    return _isOSI(from(license));
}
// biome-ignore lint/suspicious/noShadowRestrictedNames: intentional wrapper for branded type
export function toString(license) {
    return _toString(from(license));
}
// Export internal functions (tree-shakeable)
export { _isOSI, _toString };
// Export as namespace (convenience)
export const License = {
    from,
    isOSI,
    toString,
    COMMON_LICENSES,
    OSI_APPROVED_LICENSES,
};
