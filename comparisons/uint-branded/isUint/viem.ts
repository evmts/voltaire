// viem doesn't have a branded Uint type
// Implementing manual type guard similar to viem's approach

const UINT_PATTERN = /^0x(0|[1-9a-f][0-9a-f]*)$/;

function isUint(value: unknown): value is string {
	return typeof value === "string" && UINT_PATTERN.test(value);
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
	"0x00", // Invalid: leading zeros
	"0x01", // Invalid: leading zeros
	"not a hex",
	123,
	null,
	undefined,
	{},
	[],
];

export function main(): void {
	for (const value of testValues) {
		isUint(value);
	}
}
