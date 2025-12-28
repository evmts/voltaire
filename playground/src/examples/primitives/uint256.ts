import { Uint256, Uint, Hex } from "@tevm/voltaire";

// === Uint256 Creation ===
// From bigint
const value1 = Uint256.fromBigInt(42n);
const large = Uint256.fromBigInt(10n ** 18n); // 1 ETH in wei
console.log("From bigint:", value1.toBigInt());

// From number (safe integers only)
const value2 = Uint256.fromNumber(1000000);
console.log("From number:", value2.toBigInt());

// From string
const value3 = Uint256.fromString("123456789012345678901234567890");
console.log("From string:", value3.toBigInt());

// From hex
const value4 = Uint256.fromHex("0xde0b6b3a7640000"); // 1 ETH
console.log("From hex:", value4.toBigInt());

// Max and zero values
const maxValue = Uint256.fromBigInt(2n ** 256n - 1n);
const zeroValue = Uint256.zero();
console.log("Max U256:", maxValue.toHex());

// === Conversions ===
console.log("To bigint:", large.toBigInt());
console.log("To hex:", large.toHex());
console.log("To bytes:", large.toBytes());

// === Arithmetic Operations ===
const a = Uint256.fromBigInt(100n);
const b = Uint256.fromBigInt(50n);

// Basic operations
const sum = a.add(b);
const diff = a.subtract(b);
const product = a.times(b);
const quotient = a.divide(b);
const remainder = a.mod(b);

console.log("100 + 50 =", sum.toBigInt());
console.log("100 - 50 =", diff.toBigInt());
console.log("100 * 50 =", product.toBigInt());
console.log("100 / 50 =", quotient.toBigInt());
console.log("100 % 50 =", remainder.toBigInt());

// Power
const squared = a.pow(2n);
console.log("100^2 =", squared.toBigInt());

// === Bitwise Operations ===
const x = Uint256.fromBigInt(0b1100n);
const y = Uint256.fromBigInt(0b1010n);

console.log("AND:", x.and(y).toBigInt().toString(2));
console.log("OR:", x.or(y).toBigInt().toString(2));
console.log("XOR:", x.xor(y).toBigInt().toString(2));

// Bit shifts
const shifted = a.shiftLeft(8n);
console.log("100 << 8 =", shifted.toBigInt());

// === Comparison ===
console.log("a > b:", a.greaterThan(b));
console.log("a < b:", a.lessThan(b));
console.log("a == b:", a.equals(b));
console.log("Is zero:", zeroValue.isZero());

// === Common Use Cases ===
// Wei to Gwei conversion
const weiAmount = Uint256.fromBigInt(1_000_000_000_000_000_000n);
const gweiDivisor = Uint256.fromBigInt(1_000_000_000n);
const gweiAmount = weiAmount.divide(gweiDivisor);
console.log("1 ETH in Gwei:", gweiAmount.toBigInt());
