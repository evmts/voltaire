import { Bytes32, Hash } from "@tevm/voltaire";

// Bytes32: Fixed 32-byte array type
// Used for storage values, hashes, and numeric data

// Create from hex string
const value = Bytes32.fromHex(
	"0x000000000000000000000000000000000000000000000000000000000000002a",
);
console.log("From hex:", Bytes32.toHex(value));

// Create from number
const fromNum = Bytes32.fromNumber(42);
console.log("From number:", Bytes32.toNumber(fromNum));

// Create from bigint (useful for large values)
const fromBigint = Bytes32.fromBigint(BigInt("0xffffffffffffffffffffffffffffffff"));
console.log("From bigint:", Bytes32.toBigint(fromBigint));

// Zero value
const zero = Bytes32.zero();
console.log("Is zero:", Bytes32.isZero(zero));

// Comparison operations
const a = Bytes32.fromNumber(100);
const b = Bytes32.fromNumber(200);
console.log("Equals:", Bytes32.equals(a, b));
console.log("Compare:", Bytes32.compare(a, b)); // -1 (a < b)

// Min/Max operations
console.log("Min:", Bytes32.toNumber(Bytes32.min(a, b)));
console.log("Max:", Bytes32.toNumber(Bytes32.max(a, b)));

// Bitwise operations
const x = Bytes32.fromNumber(0b1010);
const y = Bytes32.fromNumber(0b1100);
console.log("AND:", Bytes32.toNumber(Bytes32.bitwiseAnd(x, y))); // 0b1000 = 8
console.log("OR:", Bytes32.toNumber(Bytes32.bitwiseOr(x, y)));   // 0b1110 = 14
console.log("XOR:", Bytes32.toNumber(Bytes32.bitwiseXor(x, y))); // 0b0110 = 6

// Clone for mutation-safe copies
const original = Bytes32.fromNumber(123);
const cloned = Bytes32.clone(original);
console.log("Cloned equals original:", Bytes32.equals(original, cloned));
