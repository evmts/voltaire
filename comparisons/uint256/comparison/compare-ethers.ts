// Ethers doesn't have uint256 compare, uses native bigint operators

// Test data covering all comparison cases
const testPairs: [bigint, bigint][] = [
	[0n, 0n], // equal
	[1n, 1n], // equal
	[1n, 2n], // less than
	[100n, 42n], // greater than
	[0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn, 0n],
];

export function main(): void {
	for (const [a, b] of testPairs) {
		const result = a < b ? -1 : a > b ? 1 : 0;
	}
}
