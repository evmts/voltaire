// Import all functions
import { compare as _compare } from "./compare.js";
import { equals as _equals } from "./equals.js";
import { from } from "./from.js";
import { toBigInt as _toBigInt } from "./toBigInt.js";
import { toGasLimit as _toGasLimit } from "./toGasLimit.js";
import { toHex as _toHex } from "./toHex.js";
import { toNumber as _toNumber } from "./toNumber.js";
import { withBuffer as _withBuffer } from "./withBuffer.js";
// Export constructor
export { from };
// Export public wrapper functions
export function toNumber(value) {
    return _toNumber.call(from(value));
}
export function toBigInt(value) {
    return _toBigInt.call(from(value));
}
export function toHex(value) {
    return _toHex.call(from(value));
}
export function equals(value1, value2) {
    return _equals.call(from(value1), from(value2));
}
export function compare(value1, value2) {
    return _compare.call(from(value1), from(value2));
}
export function withBuffer(estimate, percentageBuffer) {
    return _withBuffer.call(from(estimate), percentageBuffer);
}
export function toGasLimit(estimate) {
    return _toGasLimit.call(from(estimate));
}
// Export internal functions (tree-shakeable)
export { _toNumber, _toBigInt, _toHex, _equals, _compare, _withBuffer, _toGasLimit, };
// Export as namespace (convenience)
export const GasEstimate = {
    from,
    toNumber,
    toBigInt,
    toHex,
    equals,
    compare,
    withBuffer,
    toGasLimit,
};
