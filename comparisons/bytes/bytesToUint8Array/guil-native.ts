import {
	Bytes,
	bytesToUint8Array,
} from "../../../native/primitives/branded-types/bytes.js";

// Test data: various byte arrays
const bytes1 = Bytes("0xff");
const bytes32 = Bytes("0x" + "00".repeat(32));
const bytes1024 = Bytes("0x" + "00".repeat(1024));
const bytesEmpty = Bytes("0x");

export function main(): void {
	bytesToUint8Array(bytesEmpty);
	bytesToUint8Array(bytes1);
	bytesToUint8Array(bytes32);
	bytesToUint8Array(bytes1024);
}
