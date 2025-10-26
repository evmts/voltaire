import { toBigInt, toBeHex } from "ethers";

// Test data covering edge cases
const testValues = [
	"0x0",
	"0x1",
	"0x2a", // 42
	"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", // MAX_UINT256
	"0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
];

export function main(): void {
	for (const value of testValues) {
		const bigInt = toBigInt(value);
		toBeHex(bigInt);
	}
}
