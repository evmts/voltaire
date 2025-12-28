// Hex: Convert hex string to Uint8Array
import { Hex } from "@tevm/voltaire";

const hex = Hex("0x123456789abcdef0");
const bytes = Hex.toBytes(hex);

// With prefix and without
const withPrefix = Hex("0xdeadbeef");
const withoutPrefix = Hex("deadbeef");

// Round-trip conversion
const original = new Uint8Array([1, 2, 3, 4, 5]);
const hexString = Hex.fromBytes(original);
const restored = Hex.toBytes(hexString);
