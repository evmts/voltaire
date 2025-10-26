const testPairs: [bigint, bigint][] = [
	[0n, 0n],
	[42n, 42n],
	[42n, 100n],
	[
		0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
		0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
	],
];

export function main(): void {
	for (const [a, b] of testPairs) {
		const result = a === b;
	}
}
