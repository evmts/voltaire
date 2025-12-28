import { Hex } from "voltaire";
// Convert hex string to Uint8Array
const hex = "0x123456789abcdef0";
const bytes = hex.toBytes();

// With prefix and without
const withPrefix = "0xdeadbeef";
const withoutPrefix = "deadbeef";

// Round-trip conversion
const original = new Uint8Array([1, 2, 3, 4, 5]);
const hexString = Hex.fromBytes(original);
const restored = hexString.toBytes();
