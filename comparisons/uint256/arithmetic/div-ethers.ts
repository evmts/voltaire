// Ethers doesn't have uint256 div, uses native bigint operators

// Test data
const testPairs: [bigint, bigint][] = [
	[100n, 1n],
	[100n, 2n],
	[1000000n, 100n],
	[0xfedcba987654321n, 0x123456n],
	[0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn, 2n],
];

export function main(): void {
	for (const [a, b] of testPairs) {
		const result = a / b;
	}
}
