import { pow, fromBigInt } from "../../../src/primitives/uint-utils/uint256.js";
import type { Uint256 } from "../../../src/primitives/uint-utils/uint256.js";

// Test data - small exponents to avoid overflow
const testPairs: [Uint256, Uint256][] = [
	[fromBigInt(0n), fromBigInt(5n)],
	[fromBigInt(1n), fromBigInt(100n)],
	[fromBigInt(2n), fromBigInt(10n)],
	[fromBigInt(10n), fromBigInt(5n)],
	[fromBigInt(100n), fromBigInt(3n)],
];

export function main(): void {
	for (const [base, exponent] of testPairs) {
		pow(base, exponent);
	}
}
