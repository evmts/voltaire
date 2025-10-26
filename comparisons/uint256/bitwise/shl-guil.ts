import { shl, fromBigInt } from "../../../src/primitives/uint-utils/uint256.js";
import type { Uint256 } from "../../../src/primitives/uint-utils/uint256.js";

const testPairs: [Uint256, number][] = [
	[fromBigInt(0x1n), 0],
	[fromBigInt(0x1n), 1],
	[fromBigInt(0x1n), 8],
	[fromBigInt(0xffn), 4],
	[fromBigInt(0x123456n), 16],
];

export function main(): void {
	for (const [value, bits] of testPairs) {
		shl(value, bits);
	}
}
