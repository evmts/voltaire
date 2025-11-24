import * as Uint256 from "../../../../../src/primitives/Uint/index.js";

// Left shift (multiply by powers of 2)
const value = Uint256.fromNumber(1);
const shifted = Uint256.shiftLeft(value, 8);

// Right shift (divide by powers of 2)
const large = Uint256.fromNumber(256);
const rightShifted = Uint256.shiftRight(large, 4);

// Shift by multiple positions
const base = Uint256.fromNumber(7);
const left3 = Uint256.shiftLeft(base, 3);

// Multiply by shifting
const multiply = Uint256.shiftLeft(Uint256.fromNumber(5), 10); // 5 * 1024

// Divide by shifting
const divide = Uint256.shiftRight(Uint256.fromNumber(1000), 2); // 1000 / 4

// Shift wrapping on overflow
const maxShift = Uint256.shiftLeft(Uint256.MAX, 1);

// Right shift to zero
const shiftToZero = Uint256.shiftRight(Uint256.fromNumber(1), 10);
