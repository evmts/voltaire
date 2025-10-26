import {
	Bytes,
	concatBytes,
} from "../../../wasm/primitives/branded-types/bytes.js";

// Test data: various byte arrays to concatenate
const part1 = Bytes("0xff");
const part2 = Bytes("0xaa");
const part3 = Bytes("0x1234");
const part4 = Bytes(`0x${"00".repeat(32)}`);
const part5 = Bytes(`0x${"ff".repeat(64)}`);

export function main(): void {
	// Two parts
	concatBytes(part1, part2);

	// Three parts
	concatBytes(part1, part2, part3);

	// Five parts with larger arrays
	concatBytes(part1, part2, part3, part4, part5);
}
