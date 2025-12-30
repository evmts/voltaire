/**
 * ModExp Byte Array Interface
 *
 * The modexpBytes function matches the EIP-198 MODEXP precompile interface,
 * accepting and returning big-endian byte arrays.
 *
 * This is useful for:
 * - Direct compatibility with EVM calldata/returndata
 * - Working with binary cryptographic data
 * - Testing precompile implementations
 */

import { Hex, ModExp } from "@tevm/voltaire";

console.log("=== ModExp Byte Array Interface ===\n");

// === Helper Functions ===

/**
 * Convert BigInt to big-endian bytes with specified length
 */
function bigIntToBytes(value: bigint, length: number): Uint8Array {
	const bytes = new Uint8Array(length);
	let v = value;
	for (let i = length - 1; i >= 0; i--) {
		bytes[i] = Number(v & 0xffn);
		v >>= 8n;
	}
	return bytes;
}

/**
 * Convert big-endian bytes to BigInt
 */
function bytesToBigInt(bytes: Uint8Array): bigint {
	let result = 0n;
	for (let i = 0; i < bytes.length; i++) {
		result = (result << 8n) | BigInt(bytes[i] ?? 0);
	}
	return result;
}

// === Basic Byte Array Usage ===
console.log("--- Basic Usage ---");

// Simple: 2^10 mod 1000
const base1 = new Uint8Array([0x02]); // 2
const exp1 = new Uint8Array([0x0a]); // 10
const mod1 = new Uint8Array([0x03, 0xe8]); // 1000

const result1 = ModExp.modexpBytes(base1, exp1, mod1);

console.log("2^10 mod 1000:");
console.log("  Base bytes:", Hex.fromBytes(base1));
console.log("  Exp bytes:", Hex.fromBytes(exp1));
console.log("  Mod bytes:", Hex.fromBytes(mod1));
console.log("  Result bytes:", Hex.fromBytes(result1));
console.log("  Result value:", bytesToBigInt(result1).toString());

// === Output Padding ===
console.log("\n--- Output Padding ---");
console.log("Result is always padded to modulus length (per EIP-198).");

// 2^3 = 8, but result is padded to 4 bytes to match modulus
const base2 = new Uint8Array([0x02]);
const exp2 = new Uint8Array([0x03]);
const mod2 = new Uint8Array([0x00, 0x01, 0x00, 0x00]); // 65536

const result2 = ModExp.modexpBytes(base2, exp2, mod2);

console.log("\n2^3 mod 65536 = 8:");
console.log("  Modulus length:", mod2.length, "bytes");
console.log("  Result bytes:", Hex.fromBytes(result2));
console.log("  Note: Result is 0x00000008 (left-padded)");

// === Large Number Operations ===
console.log("\n--- Large Numbers ---");

// 256-bit numbers (32 bytes)
const base256 = bigIntToBytes(
	0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdefn,
	32,
);

const exp256 = bigIntToBytes(65537n, 32);
const mod256 = bigIntToBytes(
	0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn,
	32,
); // secp256k1 prime

const result256 = ModExp.modexpBytes(base256, exp256, mod256);

console.log("256-bit modexp:");
console.log("  Base:", Hex.fromBytes(base256).slice(0, 22) + "...");
console.log("  Exp:", Hex.fromBytes(exp256).slice(0, 22) + "...");
console.log("  Mod:", Hex.fromBytes(mod256).slice(0, 22) + "...");
console.log("  Result:", Hex.fromBytes(result256).slice(0, 22) + "...");

// === EVM Calldata Format ===
console.log("\n--- EVM Calldata Format ---");
console.log(
	"MODEXP precompile expects: base_len || exp_len || mod_len || base || exp || mod",
);

/**
 * Encode calldata for MODEXP precompile (0x05)
 */
function encodeModExpCalldata(
	base: Uint8Array,
	exp: Uint8Array,
	mod: Uint8Array,
): Uint8Array {
	const baseLenBytes = bigIntToBytes(BigInt(base.length), 32);
	const expLenBytes = bigIntToBytes(BigInt(exp.length), 32);
	const modLenBytes = bigIntToBytes(BigInt(mod.length), 32);

	const calldata = new Uint8Array(96 + base.length + exp.length + mod.length);
	calldata.set(baseLenBytes, 0);
	calldata.set(expLenBytes, 32);
	calldata.set(modLenBytes, 64);
	calldata.set(base, 96);
	calldata.set(exp, 96 + base.length);
	calldata.set(mod, 96 + base.length + exp.length);

	return calldata;
}

const calldata = encodeModExpCalldata(base1, exp1, mod1);
console.log("\nCalldata for 2^10 mod 1000:");
console.log("  Full calldata:", Hex.fromBytes(calldata));
console.log("  base_len (32 bytes):", Hex.fromBytes(calldata.slice(0, 32)));
console.log("  exp_len (32 bytes):", Hex.fromBytes(calldata.slice(32, 64)));
console.log("  mod_len (32 bytes):", Hex.fromBytes(calldata.slice(64, 96)));
console.log("  base:", Hex.fromBytes(calldata.slice(96, 96 + base1.length)));
console.log(
	"  exp:",
	Hex.fromBytes(
		calldata.slice(96 + base1.length, 96 + base1.length + exp1.length),
	),
);
console.log(
	"  mod:",
	Hex.fromBytes(
		calldata.slice(
			96 + base1.length + exp1.length,
			96 + base1.length + exp1.length + mod1.length,
		),
	),
);

// === Parsing Calldata ===
console.log("\n--- Parsing Calldata ---");

/**
 * Parse and execute MODEXP from calldata
 */
function executeModExpFromCalldata(calldata: Uint8Array): Uint8Array {
	// Parse lengths (big-endian 32-byte integers)
	const baseLen = Number(bytesToBigInt(calldata.slice(0, 32)));
	const expLen = Number(bytesToBigInt(calldata.slice(32, 64)));
	const modLen = Number(bytesToBigInt(calldata.slice(64, 96)));

	// Extract operands
	const base = calldata.slice(96, 96 + baseLen);
	const exp = calldata.slice(96 + baseLen, 96 + baseLen + expLen);
	const mod = calldata.slice(
		96 + baseLen + expLen,
		96 + baseLen + expLen + modLen,
	);

	return ModExp.modexpBytes(base, exp, mod);
}

const parsedResult = executeModExpFromCalldata(calldata);
console.log("Parsed and executed calldata:");
console.log("  Result:", Hex.fromBytes(parsedResult));
console.log(
	"  Matches direct call:",
	Hex.fromBytes(parsedResult) === Hex.fromBytes(result1),
);

// === Empty and Zero Inputs ===
console.log("\n--- Edge Cases ---");

// Zero base
const zeroBase = new Uint8Array([0x00]);
const anyExp = new Uint8Array([0x05]);
const anyMod = new Uint8Array([0x07]);
const zeroResult = ModExp.modexpBytes(zeroBase, anyExp, anyMod);
console.log("0^5 mod 7:", bytesToBigInt(zeroResult).toString());

// Zero exponent
const anyBase = new Uint8Array([0x05]);
const zeroExp = new Uint8Array([0x00]);
const expZeroResult = ModExp.modexpBytes(anyBase, zeroExp, anyMod);
console.log("5^0 mod 7:", bytesToBigInt(expZeroResult).toString());

// Empty arrays treated as zero
const emptyBase = new Uint8Array([]);
const emptyExp = new Uint8Array([]);
const simpleMod = new Uint8Array([0x0a]); // 10
const emptyResult = ModExp.modexpBytes(emptyBase, emptyExp, simpleMod);
console.log(
	"empty^empty mod 10:",
	bytesToBigInt(emptyResult).toString(),
	"(0^0 = 1 in modexp)",
);

// === RSA with Bytes ===
console.log("\n--- RSA with Byte Arrays ---");

// Small RSA example
const n = 3233n; // p=61, q=53
const e = 17n;
const d = 2753n;
const message = 42n;

// Encrypt with byte arrays
const msgBytes = bigIntToBytes(message, 2);
const eBytes = bigIntToBytes(e, 1);
const nBytes = bigIntToBytes(n, 2);

const cipherBytes = ModExp.modexpBytes(msgBytes, eBytes, nBytes);
console.log("RSA Encrypt:");
console.log("  Message bytes:", Hex.fromBytes(msgBytes));
console.log("  Ciphertext bytes:", Hex.fromBytes(cipherBytes));

// Decrypt
const dBytes = bigIntToBytes(d, 2);
const plainBytes = ModExp.modexpBytes(cipherBytes, dBytes, nBytes);
console.log("\nRSA Decrypt:");
console.log("  Plaintext bytes:", Hex.fromBytes(plainBytes));
console.log("  Recovered message:", bytesToBigInt(plainBytes).toString());
