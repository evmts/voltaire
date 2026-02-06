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

// Simple: 2^10 mod 1000
const base1 = new Uint8Array([0x02]); // 2
const exp1 = new Uint8Array([0x0a]); // 10
const mod1 = new Uint8Array([0x03, 0xe8]); // 1000

const result1 = ModExp.modexpBytes(base1, exp1, mod1);

// 2^3 = 8, but result is padded to 4 bytes to match modulus
const base2 = new Uint8Array([0x02]);
const exp2 = new Uint8Array([0x03]);
const mod2 = new Uint8Array([0x00, 0x01, 0x00, 0x00]); // 65536

const result2 = ModExp.modexpBytes(base2, exp2, mod2);

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

// Zero base
const zeroBase = new Uint8Array([0x00]);
const anyExp = new Uint8Array([0x05]);
const anyMod = new Uint8Array([0x07]);
const zeroResult = ModExp.modexpBytes(zeroBase, anyExp, anyMod);

// Zero exponent
const anyBase = new Uint8Array([0x05]);
const zeroExp = new Uint8Array([0x00]);
const expZeroResult = ModExp.modexpBytes(anyBase, zeroExp, anyMod);

// Empty arrays treated as zero
const emptyBase = new Uint8Array([]);
const emptyExp = new Uint8Array([]);
const simpleMod = new Uint8Array([0x0a]); // 10
const emptyResult = ModExp.modexpBytes(emptyBase, emptyExp, simpleMod);

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

// Decrypt
const dBytes = bigIntToBytes(d, 2);
const plainBytes = ModExp.modexpBytes(cipherBytes, dBytes, nBytes);
