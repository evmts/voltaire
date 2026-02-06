// Import internal functions
import { compare as _compare } from "./compare.js";
import { equals as _equals } from "./equals.js";
import { from } from "./from.js";
import { fromGwei } from "./fromGwei.js";
import { fromWei } from "./fromWei.js";
import { toBigInt as _toBigInt } from "./toBigInt.js";
import { toGwei as _toGwei } from "./toGwei.js";
import { toNumber as _toNumber } from "./toNumber.js";
import { toWei as _toWei } from "./toWei.js";
// Export constructors (no wrapper needed)
export { from, fromGwei, fromWei };
// Export public wrapper functions
export function toGwei(baseFee) {
    return _toGwei.call(from(baseFee));
}
export function toWei(baseFee) {
    return _toWei.call(from(baseFee));
}
export function toNumber(baseFee) {
    return _toNumber.call(from(baseFee));
}
export function toBigInt(baseFee) {
    return _toBigInt.call(from(baseFee));
}
export function equals(baseFee1, baseFee2) {
    return _equals.call(from(baseFee1), from(baseFee2));
}
export function compare(baseFee1, baseFee2) {
    return _compare.call(from(baseFee1), from(baseFee2));
}
// Export internal functions (tree-shakeable)
export { _toGwei, _toWei, _toNumber, _toBigInt, _equals, _compare };
// Export as namespace (convenience)
export const BaseFeePerGas = {
    from,
    fromGwei,
    fromWei,
    toGwei,
    toWei,
    toNumber,
    toBigInt,
    equals,
    compare,
};
