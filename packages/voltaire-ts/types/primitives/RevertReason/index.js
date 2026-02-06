import { from as _from } from "./from.js";
import { fromReturnData as _fromReturnData } from "./fromReturnData.js";
import { toString as _toString } from "./toString.js";
export * from "./constants.js";
/**
 * Create RevertReason from various inputs
 */
export function from(value) {
    return _from(value);
}
/**
 * Decode RevertReason from ReturnData
 */
export function fromReturnData(returnData) {
    return _fromReturnData(returnData);
}
/**
 * Convert RevertReason to string representation
 */
// biome-ignore lint/suspicious/noShadowRestrictedNames: intentional override for branded type conversion
export function toString(reason) {
    return _toString(reason);
}
/**
 * Internal exports for advanced usage
 */
export { _from, _fromReturnData, _toString };
