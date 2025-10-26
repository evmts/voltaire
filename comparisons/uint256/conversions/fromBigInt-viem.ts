import { toHex } from "viem";

// Test data covering edge cases
const testValues = [
	0n,
	1n,
	42n,
	0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn, // MAX_UINT256
	0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdefn,
];

export function main(): void {
	for (const value of testValues) {
		toHex(value);
	}
}
