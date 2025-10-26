// viem doesn't have branded types, uses native bigint
// Conversion is just BigInt() on the hex string

function uintToBigInt(hex: string): bigint {
	return BigInt(hex);
}

const testValues = [
	"0x0",
	"0x1",
	"0xff",
	"0xffff",
	"0xffffffff",
	"0xffffffffffffffff",
	"0xffffffffffffffffffffffffffffffff",
	"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
];

export function main(): void {
	for (const value of testValues) {
		uintToBigInt(value);
	}
}
