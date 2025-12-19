// Hex: Convert hex string to Uint8Array
import * as Hex from "../../../../src/primitives/Hex/index.js";

const hex = Hex.from("0x123456789abcdef0");
const bytes = Hex.toBytes(hex);

// With prefix and without
const withPrefix = Hex.from("0xdeadbeef");
const withoutPrefix = Hex.from("deadbeef");

// Round-trip conversion
const original = new Uint8Array([1, 2, 3, 4, 5]);
const hexString = Hex.fromBytes(original);
const restored = Hex.toBytes(hexString);
