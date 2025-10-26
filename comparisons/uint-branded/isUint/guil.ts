import { isUint } from "../../../src/primitives/branded-types/uint.js";

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
