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

console.log("\n=== Uint Basic Usage Example ===\n");

// 1. Creating Uint values
console.log("1. Creating Uint Values");
console.log("   --------------------");

// From bigint
const fromBigInt = Uint.from(100n);
console.log(`   From bigint 100n: ${fromBigInt.toString()}`);

// From number
const fromNumber = Uint.from(255);
console.log(`   From number 255: ${fromNumber.toString()}`);

// From hex string
const fromHex = Uint.fromHex("0xff");
console.log(`   From hex "0xff": ${fromHex.toString()}`);

// From decimal string
const fromString = Uint.from("12345");
console.log(`   From string "12345": ${fromString.toString()}\n`);

// 2. Conversions
console.log("2. Format Conversions");
console.log("   -----------------");

const value = Uint.from(255n);

// To hex (padded and unpadded)
console.log(`   Value: ${value.toString()}`);
console.log(`   Padded hex: ${value.toHex()}`);
console.log(`   Compact hex: ${value.toHex(false)}`);

// To different number bases
console.log(`   Binary: 0b${value.toString(2)}`);
console.log(`   Octal: 0o${value.toString(8)}`);
console.log(`   Decimal: ${value.toString(10)}`);
console.log(`   Hexadecimal: 0x${value.toString(16)}\n`);

// 3. Working with bytes
console.log("3. Byte Representation");
console.log("   ------------------");

const byteValue = Uint.from(256n);
const bytes = byteValue.toBytes();

console.log(`   Value: ${byteValue.toString()}`);
console.log(`   As bytes (32-byte array, big-endian):`);
console.log(`   - Bytes [0-3]: [${bytes.slice(0, 4).join(", ")}]`);
console.log(`   - Bytes [28-31]: [${bytes.slice(28, 32).join(", ")}]`);
console.log(`   - Total length: ${bytes.length} bytes\n`);

// Round-trip conversion
const fromBytes = Uint.fromBytes(bytes);
console.log(`   Round-trip: ${byteValue.equals(fromBytes)}\n`);

// 4. Comparisons
console.log("4. Comparisons");
console.log("   -----------");

const a = Uint.from(100n);
const b = Uint.from(200n);
const c = Uint.from(100n);

console.log(`   a = ${a.toString()}, b = ${b.toString()}, c = ${c.toString()}`);
console.log(`   a.equals(b): ${a.equals(b)}`);
console.log(`   a.equals(c): ${a.equals(c)}`);
console.log(`   a.lessThan(b): ${a.lessThan(b)}`);
console.log(`   b.greaterThan(a): ${b.greaterThan(a)}`);
console.log(`   a.lessThanOrEqual(c): ${a.lessThanOrEqual(c)}\n`);

// 5. Constants
console.log("5. Using Constants");
console.log("   --------------");

console.log(`   Uint.ZERO: ${Uint.ZERO.toString()}`);
console.log(`   Uint.ONE: ${Uint.ONE.toString()}`);
console.log(
	`   Uint.MAX: ${Uint.MAX.toString().slice(0, 50)}... (${Uint.MAX.toString().length} digits)`,
);
console.log(`   Uint.SIZE: ${Uint.SIZE} bytes\n`);

// Check if value is zero
const zero = Uint.ZERO;
const nonZero = Uint.from(42n);
console.log(`   ${zero.toString()}.isZero(): ${zero.isZero()}`);
console.log(`   ${nonZero.toString()}.isZero(): ${nonZero.isZero()}\n`);

// 6. Safe parsing with tryFrom
console.log("6. Safe Parsing");
console.log("   -----------");

const validInputs = ["100", "0xff", "42"];
const invalidInputs = ["-1", "1.5", "invalid"];

console.log("   Valid inputs:");
for (const input of validInputs) {
	const result = Uint.tryFrom(input);
	console.log(
		`   - tryFrom("${input}"): ${result ? result.toString() : "undefined"}`,
	);
}

console.log("\n   Invalid inputs:");
for (const input of invalidInputs) {
	const result = Uint.tryFrom(input);
	console.log(
		`   - tryFrom("${input}"): ${result ? result.toString() : "undefined"}`,
	);
}

console.log("\n=== Example Complete ===\n");
