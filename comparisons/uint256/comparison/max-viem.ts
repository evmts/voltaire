const testPairs: [bigint, bigint][] = [
	[0n, 1n],
	[42n, 100n],
	[100n, 42n],
	[0n, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn],
];

export function main(): void {
	for (const [a, b] of testPairs) {
		const result = a > b ? a : b;
	}
}
