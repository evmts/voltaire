import { Uint256, Uint, Hex } from "@tevm/voltaire";

// === Uint256 Creation ===
// From bigint
const value1 = Uint256.fromBigInt(42n);
const large = Uint256.fromBigInt(10n ** 18n); // 1 ETH in wei
console.log("From bigint:", Uint256.toBigInt(value1));

// From number (safe integers only)
const value2 = Uint256.fromNumber(1000000);
console.log("From number:", Uint256.toBigInt(value2));

// From string
const value3 = Uint256.fromString("123456789012345678901234567890");
console.log("From string:", Uint256.toBigInt(value3));

// From hex
const value4 = Uint256.fromHex("0xde0b6b3a7640000"); // 1 ETH
console.log("From hex:", Uint256.toBigInt(value4));

// Max and zero values
const maxValue = Uint256.fromBigInt(2n ** 256n - 1n);
const zeroValue = Uint256.zero();
console.log("Max U256:", Uint256.toHex(maxValue));

// === Conversions ===
console.log("To bigint:", Uint256.toBigInt(large));
console.log("To hex:", Uint256.toHex(large));
console.log("To bytes:", Uint256.toBytes(large));

// === Arithmetic Operations ===
const a = Uint256.fromBigInt(100n);
const b = Uint256.fromBigInt(50n);

// Basic operations
const sum = Uint.add(a, b);
const diff = Uint.subtract(a, b);
const product = Uint.times(a, b);
const quotient = Uint.divide(a, b);
const remainder = Uint.mod(a, b);

console.log("100 + 50 =", Uint.toBigInt(sum));
console.log("100 - 50 =", Uint.toBigInt(diff));
console.log("100 * 50 =", Uint.toBigInt(product));
console.log("100 / 50 =", Uint.toBigInt(quotient));
console.log("100 % 50 =", Uint.toBigInt(remainder));

// Power
const squared = Uint.pow(a, 2n);
console.log("100^2 =", Uint.toBigInt(squared));

// === Bitwise Operations ===
const x = Uint256.fromBigInt(0b1100n);
const y = Uint256.fromBigInt(0b1010n);

console.log("AND:", Uint.toBigInt(Uint.and(x, y)).toString(2));
console.log("OR:", Uint.toBigInt(Uint.or(x, y)).toString(2));
console.log("XOR:", Uint.toBigInt(Uint.xor(x, y)).toString(2));

// Bit shifts
const shifted = Uint.shiftLeft(a, 8n);
console.log("100 << 8 =", Uint.toBigInt(shifted));

// === Comparison ===
console.log("a > b:", Uint.greaterThan(a, b));
console.log("a < b:", Uint.lessThan(a, b));
console.log("a == b:", Uint.equals(a, b));
console.log("Is zero:", Uint.isZero(zeroValue));

// === Common Use Cases ===
// Wei to Gwei conversion
const weiAmount = Uint256.fromBigInt(1_000_000_000_000_000_000n);
const gweiDivisor = Uint256.fromBigInt(1_000_000_000n);
const gweiAmount = Uint.divide(weiAmount, gweiDivisor);
console.log("1 ETH in Gwei:", Uint.toBigInt(gweiAmount));
