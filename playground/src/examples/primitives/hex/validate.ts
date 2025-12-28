import { Hex } from "voltaire";
// Validate hex strings
const valid1 = "0x1234";
const valid2 = "0xdeadbeef";
const valid3 = "abcdef"; // No prefix is valid

// Invalid hex
const invalid1 = "0xghij"; // Invalid characters
const invalid2 = "0x123"; // Odd length
const invalid3 = "not hex";

// Size validation
const hex32 = `0x${"00".repeat(32)}`;

// Assert size (throws on mismatch)
try {
	Hex.assertSize(hex32, 32);
} catch (err) {}

try {
	Hex.assertSize(hex32, 16);
} catch (err) {}
