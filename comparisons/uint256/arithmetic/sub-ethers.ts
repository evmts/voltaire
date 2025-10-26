// Ethers doesn't have uint256 sub, uses native bigint operators

// Test data - safe values that won't underflow
const testPairs: [bigint, bigint][] = [
	[1n, 0n],
	[100n, 42n],
	[2000000n, 1000000n],
	[0xfedcba987654321n, 0x123456789abcdefn],
	[0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn, 1n],
];

export function main(): void {
	for (const [a, b] of testPairs) {
		const result = a - b;
	}
}
