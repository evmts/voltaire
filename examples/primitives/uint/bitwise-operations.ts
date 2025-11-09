/**
 * Example: Uint Bitwise Operations
 *
 * Demonstrates:
 * - AND, OR, XOR, NOT operations
 * - Bit shifting (left and right)
 * - Bit manipulation patterns
 * - Flags and masking
 */

import * as Uint from "../../../src/primitives/Uint/index.js";

const a = Uint.from(0b11110000n); // 240
const b = Uint.from(0b10101010n); // 170

const value = Uint.from(10n); // 0b1010

// Set bit at position
function setBit(
	num: typeof Uint.prototype,
	position: number,
): typeof Uint.prototype {
	const mask = Uint.ONE.shiftLeft(position);
	return num.bitwiseOr(mask);
}

// Clear bit at position
function clearBit(
	num: typeof Uint.prototype,
	position: number,
): typeof Uint.prototype {
	const mask = Uint.ONE.shiftLeft(position);
	return num.bitwiseAnd(mask.bitwiseNot());
}

// Toggle bit at position
function toggleBit(
	num: typeof Uint.prototype,
	position: number,
): typeof Uint.prototype {
	const mask = Uint.ONE.shiftLeft(position);
	return num.bitwiseXor(mask);
}

// Test bit at position
function testBit(num: typeof Uint.prototype, position: number): boolean {
	const mask = Uint.ONE.shiftLeft(position);
	return !num.bitwiseAnd(mask).isZero();
}

const bits = Uint.from(0b10100000n); // bits 7 and 5 set

const hexValue = Uint.fromHex("0x123456789abcdef");

const lowByte = hexValue.bitwiseAnd(Uint.fromHex("0xff"));

const lowWord = hexValue.bitwiseAnd(Uint.fromHex("0xffff"));

const lowDword = hexValue.bitwiseAnd(Uint.fromHex("0xffffffff"));

// Define permission flags
const READ = Uint.from(0b001n);
const WRITE = Uint.from(0b010n);
const EXECUTE = Uint.from(0b100n);

// Set permissions
let perms = Uint.ZERO;
perms = perms.bitwiseOr(READ);
perms = perms.bitwiseOr(WRITE);

// Check permissions
function hasPermission(
	permissions: typeof Uint.prototype,
	flag: typeof Uint.prototype,
): boolean {
	return !permissions.bitwiseAnd(flag).isZero();
}

// Remove permission
perms = perms.bitwiseAnd(WRITE.bitwiseNot());

function isPowerOfTwo(num: typeof Uint.prototype): boolean {
	if (num.isZero()) return false;
	// Power of 2 has only one bit set: n & (n-1) == 0
	return num.bitwiseAnd(num.minus(Uint.ONE)).isZero();
}

const testValues = [0n, 1n, 2n, 7n, 8n, 15n, 16n, 128n, 255n, 256n];

for (const val of testValues) {
	const testVal = Uint.from(val);
}

function extractBits(
	num: typeof Uint.prototype,
	start: number,
	length: number,
): typeof Uint.prototype {
	const mask = Uint.ONE.shiftLeft(length).minus(Uint.ONE);
	return num.shiftRight(start).bitwiseAnd(mask);
}

const data = Uint.fromHex("0xabcdef");

const byte0 = extractBits(data, 0, 8);
const byte1 = extractBits(data, 8, 8);
const byte2 = extractBits(data, 16, 8);

const one = Uint.ONE;

const large = Uint.from(2n ** 255n);
