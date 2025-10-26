import {
	compare,
	fromBigInt,
} from "../../../src/primitives/uint-utils/uint256.js";
import type { Uint256 } from "../../../src/primitives/uint-utils/uint256.js";

// Test data covering all comparison cases
const testPairs: [Uint256, Uint256][] = [
	[fromBigInt(0n), fromBigInt(0n)], // equal
	[fromBigInt(1n), fromBigInt(1n)], // equal
	[fromBigInt(1n), fromBigInt(2n)], // less than
	[fromBigInt(100n), fromBigInt(42n)], // greater than
	[
		fromBigInt(
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
		),
		fromBigInt(0n),
	],
];

export function main(): void {
	for (const [a, b] of testPairs) {
		compare(a, b);
	}
}
