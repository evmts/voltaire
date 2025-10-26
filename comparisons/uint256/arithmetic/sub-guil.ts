import { fromBigInt, sub } from "../../../src/primitives/uint-utils/uint256.js";
import type { Uint256 } from "../../../src/primitives/uint-utils/uint256.js";

// Test data - safe values that won't underflow
const testPairs: [Uint256, Uint256][] = [
	[fromBigInt(1n), fromBigInt(0n)],
	[fromBigInt(100n), fromBigInt(42n)],
	[fromBigInt(2000000n), fromBigInt(1000000n)],
	[fromBigInt(0xfedcba987654321n), fromBigInt(0x123456789abcdefn)],
	[
		fromBigInt(
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
		),
		fromBigInt(1n),
	],
];

export function main(): void {
	for (const [a, b] of testPairs) {
		sub(a, b);
	}
}
