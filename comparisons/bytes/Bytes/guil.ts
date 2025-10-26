import { Bytes } from "../../../src/primitives/branded-types/bytes.js";

// Test data: various byte arrays
const hexSmall = "0xff" as const;
const hex32Bytes = "0x" + "00".repeat(32);
const hex1024Bytes = "0x" + "00".repeat(1024);
const uint8Small = new Uint8Array([0xff]);
const uint8_32 = new Uint8Array(32);
const uint8_1024 = new Uint8Array(1024);

export function main(): void {
	// From hex strings
	Bytes(hexSmall);
	Bytes(hex32Bytes);
	Bytes(hex1024Bytes);

	// From Uint8Array
	Bytes(uint8Small);
	Bytes(uint8_32);
	Bytes(uint8_1024);
}
