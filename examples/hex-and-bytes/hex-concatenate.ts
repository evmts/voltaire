// @title Concatenate Hex Strings
// @description Combine multiple hex strings into a single hex value

// SNIPPET:START
import { Hex } from "../../src/primitives/Hex/index.js";

// Create some hex strings
const hex1 = Hex("0x1234");
const hex2 = Hex("0x5678");
const hex3 = Hex("0xabcd");

// Concatenate them (variadic arguments)
const combined = Hex.concat(hex1, hex2, hex3);

// Can also concatenate with bytes converted to hex
const bytes = new Uint8Array([0x01, 0x02, 0x03]);
const hexFromBytes = Hex.fromBytes(bytes);
const withBytes = Hex.concat(hex1, hexFromBytes);

// Concatenate just two
const twoValues = Hex.concat("0xaa", "0xbb");
// SNIPPET:END

// Test assertions
import { strict as assert } from "node:assert";

assert.equal(combined, "0x12345678abcd");
assert.equal(withBytes, "0x1234010203");
assert.equal(twoValues, "0xaabb");
process.exit(0);
