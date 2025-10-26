const testPairs: [bigint, bigint][] = [
	[0xf0n, 0x0fn],
	[
		0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaan,
		0x5555555555555555555555555555555555555555555555555555555555555555n,
	],
	[0n, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn],
	[0x123456789abcdef0n, 0xfedcba9876543210n],
];

export function main(): void {
	for (const [a, b] of testPairs) {
		const result = a | b;
	}
}
