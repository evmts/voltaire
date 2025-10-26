import {
	Bytes,
	sliceBytes,
} from "../../../wasm/primitives/branded-types/bytes.js";

// Test data: various byte arrays to slice
const bytes32 = Bytes("0x" + "00".repeat(32));
const bytes1024 = Bytes("0x" + "00".repeat(1024));

export function main(): void {
	// Slice first 4 bytes
	sliceBytes(bytes32, 0, 4);

	// Slice middle bytes
	sliceBytes(bytes32, 4, 20);

	// Slice from position to end
	sliceBytes(bytes32, 16);

	// Slice larger array
	sliceBytes(bytes1024, 0, 256);
	sliceBytes(bytes1024, 256, 512);
	sliceBytes(bytes1024, 512);
}
