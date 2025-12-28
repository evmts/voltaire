import { Uint256 } from "voltaire";
// Minimum of two values
const a = Uint256.fromNumber(10);
const b = Uint256.fromNumber(20);
const min = Uint256.minimum(a, b);

// Maximum of two values
const max = Uint256.maximum(a, b);

// Bit length (number of significant bits)
const value = Uint256.fromNumber(255);
const bits = Uint256.bitLength(value);

const power = Uint256.fromNumber(256);

// Leading zeros
const small = Uint256.fromNumber(1);

// Pop count (number of 1 bits)
const allOnes = Uint256.fromNumber(0b11111111);

const sparse = Uint256.fromNumber(0b10101010);

// Clone value
const original = Uint256.fromNumber(42);
const cloned = Uint256.clone(original);
