import { Uint256 } from "voltaire";
// Basic exponentiation
const base = Uint256.fromNumber(2);
const exp = Uint256.fromNumber(10);
const result = Uint256.toPower(base, exp);

// Square a number
const value = Uint256.fromNumber(12);
const squared = Uint256.toPower(value, Uint256.fromNumber(2));

// Cube a number
const cubed = Uint256.toPower(Uint256.fromNumber(5), Uint256.fromNumber(3));

// Power of 0 equals 1
const zero = Uint256.toPower(Uint256.fromNumber(42), Uint256.ZERO);

// Power of 1 (identity)
const one = Uint256.toPower(Uint256.fromNumber(42), Uint256.ONE);

// Large power (with overflow wrapping)
const largePower = Uint256.toPower(
	Uint256.fromNumber(2),
	Uint256.fromNumber(100),
);
