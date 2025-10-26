import { numberToHex, toHex } from "viem";

// Test data: various byte values
const hexValues = ["0x00", "0xff", "0x7f", "0x80"] as const;
const numericValues = [0, 255, 127, 128];

export function main(): void {
	// From hex strings
	for (const hex of hexValues) {
		toHex(hex);
	}

	// From numbers
	for (const num of numericValues) {
		numberToHex(num);
	}
}
