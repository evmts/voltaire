import { Hex } from "@tevm/voltaire";
// Compare hex values for equality
const hex1 = Hex("0xdeadbeef");
const hex2 = Hex("0xdeadbeef");
const hex3 = Hex("0xDEADBEEF"); // Different case
const hex4 = Hex("deadbeef"); // No prefix

// Different values
const different = Hex("0xcafebabe");

// Zero comparisons
const zero1 = Hex("0x00");
const zero2 = Hex("0x0000");
