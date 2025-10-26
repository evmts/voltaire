import {
	Uint,
	uintToBigInt,
} from "../../../wasm/primitives/branded-types/uint.js";

const testValues = [
	Uint(0n),
	Uint(1n),
	Uint(0xffn),
	Uint(0xffffn),
	Uint(0xffffffffn),
	Uint(0xffffffffffffffffn),
	Uint((1n << 128n) - 1n),
	Uint((1n << 256n) - 1n),
];

export function main(): void {
	for (const value of testValues) {
		uintToBigInt(value);
	}
}
