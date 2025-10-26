import {
	isByte,
	isBytes,
} from "../../../wasm/primitives/branded-types/bytes.js";

// Test data: valid and invalid values
const validBytes = ["0x", "0xff", "0x1234", `0x${"00".repeat(32)}`];
const invalidBytes = ["0x1", "0xgg", "not-hex", "", 123];
const validByte = ["0x", "0x0", "0x00", "0xff"];
const invalidByte = ["0x100", "0xggg", "not-hex", "", 256];

export function main(): void {
	// Test isBytes
	for (const val of validBytes) {
		isBytes(val);
	}
	for (const val of invalidBytes) {
		isBytes(val);
	}

	// Test isByte
	for (const val of validByte) {
		isByte(val);
	}
	for (const val of invalidByte) {
		isByte(val);
	}
}
