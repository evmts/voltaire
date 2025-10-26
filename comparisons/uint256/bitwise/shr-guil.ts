import { fromBigInt, shr } from "../../../src/primitives/uint-utils/uint256.js";
import type { Uint256 } from "../../../src/primitives/uint-utils/uint256.js";

const testPairs: [Uint256, number][] = [
	[
		fromBigInt(
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
		),
		0,
	],
	[
		fromBigInt(
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
		),
		1,
	],
	[
		fromBigInt(
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
		),
		8,
	],
	[fromBigInt(0xff00n), 4],
	[fromBigInt(0x123456789abcdefn), 16],
];

export function main(): void {
	for (const [value, bits] of testPairs) {
		shr(value, bits);
	}
}
