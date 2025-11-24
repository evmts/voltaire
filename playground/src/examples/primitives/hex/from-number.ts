import * as Hex from "../../../primitives/Hex/index.js";

// Convert numbers to hex
const num1 = 255;
const hex1 = Hex.fromNumber(num1);

// Larger numbers
const num2 = 1000000;
const hex2 = Hex.fromNumber(num2);

// Fixed size padding
const num3 = 42;
const hex3_32 = Hex.fromNumber(num3, 32);

// Zero
const zero = Hex.fromNumber(0);

// Max safe integer
const maxSafe = Number.MAX_SAFE_INTEGER;
const hexMax = Hex.fromNumber(maxSafe);
