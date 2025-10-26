const testPairs: [bigint, bigint][] = [
	[1n, 0n],
	[100n, 42n],
	[42n, 100n],
	[0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn, 0n],
];

export function main(): void {
	for (const [a, b] of testPairs) {
		const result = a > b;
	}
}
