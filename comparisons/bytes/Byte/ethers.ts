import { hexlify, toBeArray } from "ethers";

// Test data: various byte values
const hexValues = ["0x00", "0xff", "0x7f", "0x80"] as const;
const numericValues = [0, 255, 127, 128];

export function main(): void {
	// From hex strings
	for (const hex of hexValues) {
		hexlify(hex);
	}

	// From numbers - convert to Uint8Array first
	for (const num of numericValues) {
		hexlify(toBeArray(num));
	}
}
