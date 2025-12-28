import { Uint256 } from "voltaire";
// Convert to hex
const value = Uint256.fromNumber(255);
const hex = Uint256.toHex(value);

// Large number to hex
const large = Uint256.fromBigInt(123456789012345678901234567890n);

// Zero to hex
const zero = Uint256.ZERO;

// Max value to hex
const max = Uint256.MAX;

// Padded hex output
const small = Uint256.fromNumber(1);

// Roundtrip conversion
const original = "0x123456";
const uint = Uint256.fromHex(original);
const converted = Uint256.toHex(uint);
