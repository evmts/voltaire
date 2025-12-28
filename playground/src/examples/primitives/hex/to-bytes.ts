import { Hex, Bytes } from "@tevm/voltaire";
// Convert hex string to Bytes
const hex = Hex("0x123456789abcdef0");
const bytes = hex.toBytes();

// With prefix and without
const withPrefix = Hex("0xdeadbeef");
const withoutPrefix = Hex("deadbeef");

// Round-trip conversion
const original = Bytes([1, 2, 3, 4, 5]);
const hexString = Hex.fromBytes(original);
const restored = hexString.toBytes();
