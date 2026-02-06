// Import all functions
import { from } from "./from.js";
import { increment as _increment } from "./increment.js";
import { toBigInt as _toBigInt } from "./toBigInt.js";
import { toNumber as _toNumber } from "./toNumber.js";
// Export constructors
export { from };
// Export public wrapper functions
export function toNumber(nonce) {
    return _toNumber.call(from(nonce));
}
export function toBigInt(nonce) {
    return _toBigInt.call(from(nonce));
}
export function increment(nonce) {
    return _increment.call(from(nonce));
}
// Export internal functions (tree-shakeable)
export { _toNumber, _toBigInt, _increment };
// Export as callable constructor and namespace
export const Nonce = Object.assign(from, {
    from,
    toNumber,
    toBigInt,
    increment,
});
