// Viem doesn't have uint256 add, uses native bigint operators

// Test data - safe values that won't overflow
const testPairs: [bigint, bigint][] = [
	[0n, 0n],
	[1n, 1n],
	[42n, 100n],
	[1000000n, 2000000n],
	[0x123456789abcdefn, 0xfedcba987654321n],
];

export function main(): void {
	for (const [a, b] of testPairs) {
		const result = a + b;
	}
}
