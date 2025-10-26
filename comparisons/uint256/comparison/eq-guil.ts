import { eq, fromBigInt } from "../../../src/primitives/uint-utils/uint256.js";
import type { Uint256 } from "../../../src/primitives/uint-utils/uint256.js";

const testPairs: [Uint256, Uint256][] = [
	[fromBigInt(0n), fromBigInt(0n)],
	[fromBigInt(42n), fromBigInt(42n)],
	[fromBigInt(42n), fromBigInt(100n)],
	[
		fromBigInt(
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
		),
		fromBigInt(
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
		),
	],
];

export function main(): void {
	for (const [a, b] of testPairs) {
		eq(a, b);
	}
}
