import * as Uint256 from "../../../../../src/primitives/Uint/index.js";

// Left shift (multiply by powers of 2)
const value = Uint256.fromNumber(1);
const shifted = Uint256.shiftLeft(value, 8);
console.log("1 << 8 =", Uint256.toNumber(shifted));

// Right shift (divide by powers of 2)
const large = Uint256.fromNumber(256);
const rightShifted = Uint256.shiftRight(large, 4);
console.log("256 >> 4 =", Uint256.toNumber(rightShifted));

// Shift by multiple positions
const base = Uint256.fromNumber(7);
const left3 = Uint256.shiftLeft(base, 3);
console.log("7 << 3 =", Uint256.toNumber(left3));

// Multiply by shifting
const multiply = Uint256.shiftLeft(Uint256.fromNumber(5), 10); // 5 * 1024
console.log("5 * 2^10 =", Uint256.toNumber(multiply));

// Divide by shifting
const divide = Uint256.shiftRight(Uint256.fromNumber(1000), 2); // 1000 / 4
console.log("1000 / 2^2 =", Uint256.toNumber(divide));

// Shift wrapping on overflow
const maxShift = Uint256.shiftLeft(Uint256.MAX, 1);
console.log("MAX << 1 wraps:", Uint256.toHex(maxShift));

// Right shift to zero
const shiftToZero = Uint256.shiftRight(Uint256.fromNumber(1), 10);
console.log("1 >> 10 = 0:", Uint256.isZero(shiftToZero));
