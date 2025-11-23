import * as Uint256 from "../../../../../src/primitives/Uint/index.js";

// Minimum of two values
const a = Uint256.fromNumber(10);
const b = Uint256.fromNumber(20);
const min = Uint256.minimum(a, b);
console.log("min(10, 20) =", Uint256.toNumber(min));

// Maximum of two values
const max = Uint256.maximum(a, b);
console.log("max(10, 20) =", Uint256.toNumber(max));

// Bit length (number of significant bits)
const value = Uint256.fromNumber(255);
const bits = Uint256.bitLength(value);
console.log("Bit length of 255:", bits);

const power = Uint256.fromNumber(256);
console.log("Bit length of 256:", Uint256.bitLength(power));

// Leading zeros
const small = Uint256.fromNumber(1);
console.log("Leading zeros of 1:", Uint256.leadingZeros(small));

// Pop count (number of 1 bits)
const allOnes = Uint256.fromNumber(0b11111111);
console.log("Pop count of 0b11111111:", Uint256.popCount(allOnes));

const sparse = Uint256.fromNumber(0b10101010);
console.log("Pop count of 0b10101010:", Uint256.popCount(sparse));

// Min/max with constants
console.log(
	"min(value, MAX):",
	Uint256.toNumber(Uint256.minimum(Uint256.fromNumber(100), Uint256.MAX)),
);
console.log(
	"max(value, ZERO):",
	Uint256.toNumber(Uint256.maximum(Uint256.fromNumber(100), Uint256.ZERO)),
);

// Clone value
const original = Uint256.fromNumber(42);
const cloned = Uint256.clone(original);
console.log("Clone equals original:", Uint256.equals(original, cloned));
