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
export function toGwei(priorityFee) {
    return _toGwei.call(from(priorityFee));
}
export function toWei(priorityFee) {
    return _toWei.call(from(priorityFee));
}
export function toNumber(priorityFee) {
    return _toNumber.call(from(priorityFee));
}
export function toBigInt(priorityFee) {
    return _toBigInt.call(from(priorityFee));
}
export function equals(priorityFee1, priorityFee2) {
    return _equals.call(from(priorityFee1), from(priorityFee2));
}
export function compare(priorityFee1, priorityFee2) {
    return _compare.call(from(priorityFee1), from(priorityFee2));
}
// Export internal functions (tree-shakeable)
export { _toGwei, _toWei, _toNumber, _toBigInt, _equals, _compare };
// Export as namespace (convenience)
export const MaxPriorityFeePerGas = {
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
