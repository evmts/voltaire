const testPairs: [bigint, number][] = [
	[0x1n, 0],
	[0x1n, 1],
	[0x1n, 8],
	[0xffn, 4],
	[0x123456n, 16],
];

export function main(): void {
	for (const [value, bits] of testPairs) {
		const result = value << BigInt(bits);
	}
}
