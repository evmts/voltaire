import { fromBigInt, mod } from "../../../src/primitives/uint-utils/uint256.js";
import type { Uint256 } from "../../../src/primitives/uint-utils/uint256.js";

// Test data
const testPairs: [Uint256, Uint256][] = [
	[fromBigInt(100n), fromBigInt(7n)],
	[fromBigInt(1000n), fromBigInt(13n)],
	[fromBigInt(1000000n), fromBigInt(999n)],
	[fromBigInt(0xfedcba987654321n), fromBigInt(0x12345n)],
	[
		fromBigInt(
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
		),
		fromBigInt(0xffffn),
	],
];

export function main(): void {
	for (const [a, b] of testPairs) {
		mod(a, b);
	}
}
