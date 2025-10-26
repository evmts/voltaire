import { concat } from "viem";

// Test data: various byte arrays to concatenate
const part1 = "0xff";
const part2 = "0xaa";
const part3 = "0x1234";
const part4 = `0x${"00".repeat(32)}`;
const part5 = `0x${"ff".repeat(64)}`;

export function main(): void {
	// Two parts
	concat([part1, part2]);

	// Three parts
	concat([part1, part2, part3]);

	// Five parts with larger arrays
	concat([part1, part2, part3, part4, part5]);
}
