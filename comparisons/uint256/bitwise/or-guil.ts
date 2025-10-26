import { fromBigInt, or } from "../../../src/primitives/uint-utils/uint256.js";
import type { Uint256 } from "../../../src/primitives/uint-utils/uint256.js";

const testPairs: [Uint256, Uint256][] = [
	[fromBigInt(0xf0n), fromBigInt(0x0fn)],
	[
		fromBigInt(
			0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaan,
		),
		fromBigInt(
			0x5555555555555555555555555555555555555555555555555555555555555555n,
		),
	],
	[
		fromBigInt(0n),
		fromBigInt(
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
		),
	],
	[fromBigInt(0x123456789abcdef0n), fromBigInt(0xfedcba9876543210n)],
];

export function main(): void {
	for (const [a, b] of testPairs) {
		or(a, b);
	}
}
