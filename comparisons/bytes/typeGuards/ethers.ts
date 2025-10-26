import { isHexString } from "ethers";

// Test data: valid and invalid values
const validBytes = ["0x", "0xff", "0x1234", `0x${"00".repeat(32)}`];
const invalidBytes = ["0x1", "0xgg", "not-hex", "", 123];
const validByte = ["0x", "0x0", "0x00", "0xff"];
const invalidByte = ["0x100", "0xggg", "not-hex", "", 256];

export function main(): void {
	// Test isHexString for bytes (even length check)
	for (const val of validBytes) {
		isHexString(val);
	}
	for (const val of invalidBytes) {
		isHexString(val);
	}

	// Test isHexString for single bytes (length 1)
	for (const val of validByte) {
		isHexString(val, 1);
	}
	for (const val of invalidByte) {
		isHexString(val, 1);
	}
}
