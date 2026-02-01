import { Bytes } from "@tevm/voltaire";
// Universal constructor handles multiple types

// From array of bytes
const fromArray = Bytes([0x12, 0x34, 0x56]);

// From hex string (0x prefix)
const fromHexStr = Bytes("0xabcdef");

// From UTF-8 string (no 0x prefix)
const fromUtf8 = Bytes("Hello");

// Auto-detection based on input
const inputs = [Bytes([0xff]), "0x1234", "test"];
inputs.forEach((input) => {
	const bytes = Bytes(input);
});
