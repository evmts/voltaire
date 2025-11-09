/**
 * Example: Uint Basic Usage
 *
 * Demonstrates:
 * - Creating Uint values from different formats
 * - Converting between formats
 * - Basic comparisons
 * - Constants usage
 */

import * as Uint from "../../../src/primitives/Uint/index.js";

// From bigint
const fromBigInt = Uint.from(100n);

// From number
const fromNumber = Uint.from(255);

// From hex string
const fromHex = Uint.fromHex("0xff");

// From decimal string
const fromString = Uint.from("12345");

const value = Uint.from(255n);

const byteValue = Uint.from(256n);
const bytes = byteValue.toBytes();

// Round-trip conversion
const fromBytes = Uint.fromBytes(bytes);

const a = Uint.from(100n);
const b = Uint.from(200n);
const c = Uint.from(100n);

// Check if value is zero
const zero = Uint.ZERO;
const nonZero = Uint.from(42n);

const validInputs = ["100", "0xff", "42"];
const invalidInputs = ["-1", "1.5", "invalid"];
for (const input of validInputs) {
	const result = Uint.tryFrom(input);
}
for (const input of invalidInputs) {
	const result = Uint.tryFrom(input);
}
