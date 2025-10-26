const MAX_UINT256 =
	0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;

const testValues: bigint[] = [
	0n,
	0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
	0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaan,
	0x123456789abcdef0123456789abcdef0n,
];

export function main(): void {
	for (const value of testValues) {
		const result = MAX_UINT256 ^ value;
	}
}
