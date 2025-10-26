import {
	Bytes,
	bytesLength,
} from "../../../wasm/primitives/branded-types/bytes.js";

// Test data: various byte arrays
const bytesEmpty = Bytes("0x");
const bytes1 = Bytes("0xff");
const bytes32 = Bytes("0x" + "00".repeat(32));
const bytes1024 = Bytes("0x" + "00".repeat(1024));

export function main(): void {
	bytesLength(bytesEmpty);
	bytesLength(bytes1);
	bytesLength(bytes32);
	bytesLength(bytes1024);
}
