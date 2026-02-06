import { Hex } from "@tevm/voltaire";
// Convert hex to number
const hex1 = "0xff";
const num1 = Hex.toNumber(hex1);

// Larger values
const hex2 = "0xf4240"; // 1,000,000
const num2 = Hex.toNumber(hex2);

// Leading zeros
const hex3 = "0x00002a"; // 42
const num3 = Hex.toNumber(hex3);

// Round-trip conversion
const original = 12345;
const hexed = Hex.fromNumber(original);
const restored = Hex.toNumber(hexed);

// Zero
const zero = Hex.toNumber("0x00");
