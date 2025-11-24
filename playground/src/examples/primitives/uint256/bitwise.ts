import * as Uint256 from "../../../../../src/primitives/Uint/index.js";

// Bitwise AND
const a = Uint256.fromNumber(0b1100);
const b = Uint256.fromNumber(0b1010);
const and = Uint256.bitwiseAnd(a, b);

// Bitwise OR
const or = Uint256.bitwiseOr(a, b);

// Bitwise XOR
const xor = Uint256.bitwiseXor(a, b);

// Bitwise NOT
const value = Uint256.fromNumber(0);
const not = Uint256.bitwiseNot(value);

// Clear specific bits with AND
const flags = Uint256.fromNumber(0b11111111);
const mask = Uint256.fromNumber(0b11110000);
const cleared = Uint256.bitwiseAnd(flags, mask);

// Set specific bits with OR
const setBits = Uint256.bitwiseOr(
	Uint256.fromNumber(0b10000000),
	Uint256.fromNumber(0b00000001),
);

// Toggle bits with XOR
const toggle = Uint256.bitwiseXor(
	Uint256.fromNumber(0b11110000),
	Uint256.fromNumber(0b00001111),
);
