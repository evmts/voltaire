import { Uint256 } from "@tevm/voltaire";

// === Uint256 Creation ===
// From bigint (main constructor)
const value1 = Uint256.fromBigInt(42n);
const large = Uint256.fromBigInt(10n ** 18n); // 1 ETH in wei

// From number (safe integers only)
const value2 = Uint256.fromNumber(1000000);

// From generic value (bigint, number, or string)
const value3 = Uint256.from("123456789012345678901234567890");

// From hex
const value4 = Uint256.fromHex("0xde0b6b3a7640000"); // 1 ETH

// Max and zero values (constants, not functions)
const maxValue = Uint256.MAX;
const zeroValue = Uint256.ZERO;

// === Arithmetic Operations ===
const a = Uint256.fromBigInt(100n);
const b = Uint256.fromBigInt(50n);

// Basic operations (static methods taking two Uint256 values)
const sum = Uint256.plus(a, b);
const diff = Uint256.minus(a, b);
const product = Uint256.times(a, b);
const quotient = Uint256.dividedBy(a, b);
const remainder = Uint256.modulo(a, b);

// Power
const exponent = Uint256.fromBigInt(2n);
const squared = Uint256.toPower(a, exponent);

// === Bitwise Operations ===
const x = Uint256.fromBigInt(0b1100n);
const y = Uint256.fromBigInt(0b1010n);

// Bitwise AND, OR, XOR
const andResult = Uint256.bitwiseAnd(x, y);
const orResult = Uint256.bitwiseOr(x, y);
const xorResult = Uint256.bitwiseXor(x, y);

// Bit shifts
const shiftAmount = Uint256.fromBigInt(8n);
const shifted = Uint256.shiftLeft(a, shiftAmount);

// === Common Use Cases ===
// Wei to Gwei conversion
const weiAmount = Uint256.fromBigInt(1_000_000_000_000_000_000n);
const gweiDivisor = Uint256.fromBigInt(1_000_000_000n);
const gweiAmount = Uint256.dividedBy(weiAmount, gweiDivisor);

// Comparisons
const isEqual = Uint256.equals(a, b);
const isLess = Uint256.lessThan(a, b);
const isGreater = Uint256.greaterThan(a, b);
