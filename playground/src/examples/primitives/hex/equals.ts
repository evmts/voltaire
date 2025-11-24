import * as Hex from "../../../primitives/Hex/index.js";

// Compare hex values for equality
const hex1 = Hex.from("0xdeadbeef");
const hex2 = Hex.from("0xdeadbeef");
const hex3 = Hex.from("0xDEADBEEF"); // Different case
const hex4 = Hex.from("deadbeef"); // No prefix

// Different values
const different = Hex.from("0xcafebabe");

// Zero comparisons
const zero1 = Hex.from("0x00");
const zero2 = Hex.from("0x0000");
