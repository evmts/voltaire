import { Hex, Uint, Uint256 } from "@tevm/voltaire";

// === Uint256 Creation ===
// From bigint
const value1 = Uint256.fromBigInt(42n);
const large = Uint256.fromBigInt(10n ** 18n); // 1 ETH in wei

// From number (safe integers only)
const value2 = Uint256.fromNumber(1000000);

// From string
const value3 = Uint256.fromString("123456789012345678901234567890");

// From hex
const value4 = Uint256.fromHex("0xde0b6b3a7640000"); // 1 ETH

// Max and zero values
const maxValue = Uint256.fromBigInt(2n ** 256n - 1n);
const zeroValue = Uint256.zero();

// === Arithmetic Operations ===
const a = Uint256.fromBigInt(100n);
const b = Uint256.fromBigInt(50n);

// Basic operations
const sum = a.add(b);
const diff = a.subtract(b);
const product = a.times(b);
const quotient = a.divide(b);
const remainder = a.mod(b);

// Power
const squared = a.pow(2n);

// === Bitwise Operations ===
const x = Uint256.fromBigInt(0b1100n);
const y = Uint256.fromBigInt(0b1010n);

// Bit shifts
const shifted = a.shiftLeft(8n);

// === Common Use Cases ===
// Wei to Gwei conversion
const weiAmount = Uint256.fromBigInt(1_000_000_000_000_000_000n);
const gweiDivisor = Uint256.fromBigInt(1_000_000_000n);
const gweiAmount = weiAmount.divide(gweiDivisor);
