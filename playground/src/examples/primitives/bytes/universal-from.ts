import { Bytes } from "voltaire";
// Universal constructor handles multiple types

// From Uint8Array
const raw = new Uint8Array([0x12, 0x34, 0x56]);
const fromArray = Bytes.from(raw);

// From hex string (0x prefix)
const fromHexStr = Bytes.from("0xabcdef");

// From UTF-8 string (no 0x prefix)
const fromUtf8 = Bytes.from("Hello");

// Auto-detection based on input
const inputs = [new Uint8Array([0xff]), "0x1234", "test"];
inputs.forEach((input) => {
	const bytes = Bytes.from(input);
});
