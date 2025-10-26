import { fromBigInt, not } from "../../../src/primitives/uint-utils/uint256.js";
import type { Uint256 } from "../../../src/primitives/uint-utils/uint256.js";

const testValues: Uint256[] = [
	fromBigInt(0n),
	fromBigInt(
		0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
	),
	fromBigInt(
		0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaan,
	),
	fromBigInt(0x123456789abcdef0123456789abcdef0n),
];

export function main(): void {
	for (const value of testValues) {
		not(value);
	}
}
