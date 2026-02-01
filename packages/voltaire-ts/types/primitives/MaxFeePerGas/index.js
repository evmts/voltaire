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
export function toGwei(maxFee) {
    return _toGwei.call(from(maxFee));
}
export function toWei(maxFee) {
    return _toWei.call(from(maxFee));
}
export function toNumber(maxFee) {
    return _toNumber.call(from(maxFee));
}
export function toBigInt(maxFee) {
    return _toBigInt.call(from(maxFee));
}
export function equals(maxFee1, maxFee2) {
    return _equals.call(from(maxFee1), from(maxFee2));
}
export function compare(maxFee1, maxFee2) {
    return _compare.call(from(maxFee1), from(maxFee2));
}
// Export internal functions (tree-shakeable)
export { _toGwei, _toWei, _toNumber, _toBigInt, _equals, _compare };
// Export as namespace (convenience)
export const MaxFeePerGas = {
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
