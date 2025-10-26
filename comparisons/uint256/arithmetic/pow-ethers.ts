// Ethers doesn't have uint256 pow, uses native bigint operators

// Test data - small exponents to avoid overflow
const testPairs: [bigint, bigint][] = [
	[0n, 5n],
	[1n, 100n],
	[2n, 10n],
	[10n, 5n],
	[100n, 3n],
];

export function main(): void {
	for (const [base, exponent] of testPairs) {
		const result = base ** exponent;
	}
}
