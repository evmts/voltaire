import { toBigInt } from "../../../src/primitives/uint-utils/uint256.js";
import type { Uint256 } from "../../../src/primitives/uint-utils/uint256.js";

// Test data covering edge cases
const testValues: Uint256[] = [
	"0x0" as Uint256,
	"0x1" as Uint256,
	"0x2a" as Uint256, // 42
	"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff" as Uint256, // MAX_UINT256
	"0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef" as Uint256,
];

export function main(): void {
	for (const value of testValues) {
		toBigInt(value);
	}
}
