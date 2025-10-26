// Viem doesn't have uint256 mul, uses native bigint operators

// Test data - safe values that won't overflow
const testPairs: [bigint, bigint][] = [
	[0n, 42n],
	[1n, 100n],
	[42n, 100n],
	[1000n, 2000n],
	[0x123456n, 0xabcdefn],
];

export function main(): void {
	for (const [a, b] of testPairs) {
		const result = a * b;
	}
}
