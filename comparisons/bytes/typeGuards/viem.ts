import { isHex } from "viem";

// Test data: valid and invalid values
const validBytes = ["0x", "0xff", "0x1234", `0x${"00".repeat(32)}`];
const invalidBytes = ["0x1", "0xgg", "not-hex", "", 123];
const validByte = ["0x", "0x0", "0x00", "0xff"];
const invalidByte = ["0x100", "0xggg", "not-hex", "", 256];

export function main(): void {
	// Test isHex for bytes
	for (const val of validBytes) {
		isHex(val);
	}
	for (const val of invalidBytes) {
		isHex(val);
	}

	// Test isHex for single bytes
	for (const val of validByte) {
		isHex(val);
	}
	for (const val of invalidByte) {
		isHex(val);
	}
}
