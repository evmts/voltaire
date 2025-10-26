const testPairs: [bigint, number][] = [
	[0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn, 0],
	[0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn, 1],
	[0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn, 8],
	[0xff00n, 4],
	[0x123456789abcdefn, 16],
];

export function main(): void {
	for (const [value, bits] of testPairs) {
		const result = value >> BigInt(bits);
	}
}
