// Ethers doesn't have uint256 mod, uses native bigint operators

// Test data
const testPairs: [bigint, bigint][] = [
	[100n, 7n],
	[1000n, 13n],
	[1000000n, 999n],
	[0xfedcba987654321n, 0x12345n],
	[
		0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
		0xffffn,
	],
];

export function main(): void {
	for (const [a, b] of testPairs) {
		const result = a % b;
	}
}
