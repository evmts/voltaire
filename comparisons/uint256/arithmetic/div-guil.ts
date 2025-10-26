import { div, fromBigInt } from "../../../src/primitives/uint-utils/uint256.js";
import type { Uint256 } from "../../../src/primitives/uint-utils/uint256.js";

// Test data
const testPairs: [Uint256, Uint256][] = [
	[fromBigInt(100n), fromBigInt(1n)],
	[fromBigInt(100n), fromBigInt(2n)],
	[fromBigInt(1000000n), fromBigInt(100n)],
	[fromBigInt(0xfedcba987654321n), fromBigInt(0x123456n)],
	[
		fromBigInt(
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
		),
		fromBigInt(2n),
	],
];

export function main(): void {
	for (const [a, b] of testPairs) {
		div(a, b);
	}
}
