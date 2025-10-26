import { add, fromBigInt } from "../../../src/primitives/uint-utils/uint256.js";
import type { Uint256 } from "../../../src/primitives/uint-utils/uint256.js";

// Test data - safe values that won't overflow
const testPairs: [Uint256, Uint256][] = [
	[fromBigInt(0n), fromBigInt(0n)],
	[fromBigInt(1n), fromBigInt(1n)],
	[fromBigInt(42n), fromBigInt(100n)],
	[fromBigInt(1000000n), fromBigInt(2000000n)],
	[fromBigInt(0x123456789abcdefn), fromBigInt(0xfedcba987654321n)],
];

export function main(): void {
	for (const [a, b] of testPairs) {
		add(a, b);
	}
}
