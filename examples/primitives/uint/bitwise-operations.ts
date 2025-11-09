/**
 * Example: Uint Bitwise Operations
 *
 * Demonstrates:
 * - AND, OR, XOR, NOT operations
 * - Bit shifting (left and right)
 * - Bit manipulation patterns
 * - Flags and masking
 */

import * as Uint from '../../../src/primitives/Uint/index.js';

console.log('\n=== Uint Bitwise Operations Example ===\n');

// 1. Basic bitwise operations
console.log('1. Basic Bitwise Operations');
console.log('   -----------------------');

const a = Uint.from(0b11110000n); // 240
const b = Uint.from(0b10101010n); // 170

console.log(`   a = ${a.toString()} (0b${a.toString(2)})`);
console.log(`   b = ${b.toString()} (0b${b.toString(2)})\n`);

console.log(`   a AND b = ${a.bitwiseAnd(b).toString()} (0b${a.bitwiseAnd(b).toString(2)})`);
console.log(`   a OR b  = ${a.bitwiseOr(b).toString()} (0b${a.bitwiseOr(b).toString(2)})`);
console.log(`   a XOR b = ${a.bitwiseXor(b).toString()} (0b${a.bitwiseXor(b).toString(2)})`);
console.log(`   NOT a   = ${a.bitwiseNot().toHex(false)}\n`);

// 2. Bit shifting
console.log('2. Bit Shifting');
console.log('   -----------');

const value = Uint.from(10n); // 0b1010

console.log(`   Value: ${value.toString()} (0b${value.toString(2)})\n`);
console.log(`   Left shift by 1:  ${value.shiftLeft(1).toString()} (multiply by 2)`);
console.log(`   Left shift by 2:  ${value.shiftLeft(2).toString()} (multiply by 4)`);
console.log(`   Left shift by 8:  ${value.shiftLeft(8).toString()} (multiply by 256)\n`);
console.log(`   Right shift by 1: ${value.shiftRight(1).toString()} (divide by 2)`);
console.log(`   Right shift by 2: ${value.shiftRight(2).toString()} (divide by 4)\n`);

// 3. Bit manipulation functions
console.log('3. Bit Manipulation Functions');
console.log('   -------------------------');

// Set bit at position
function setBit(num: typeof Uint.prototype, position: number): typeof Uint.prototype {
	const mask = Uint.ONE.shiftLeft(position);
	return num.bitwiseOr(mask);
}

// Clear bit at position
function clearBit(num: typeof Uint.prototype, position: number): typeof Uint.prototype {
	const mask = Uint.ONE.shiftLeft(position);
	return num.bitwiseAnd(mask.bitwiseNot());
}

// Toggle bit at position
function toggleBit(num: typeof Uint.prototype, position: number): typeof Uint.prototype {
	const mask = Uint.ONE.shiftLeft(position);
	return num.bitwiseXor(mask);
}

// Test bit at position
function testBit(num: typeof Uint.prototype, position: number): boolean {
	const mask = Uint.ONE.shiftLeft(position);
	return !num.bitwiseAnd(mask).isZero();
}

const bits = Uint.from(0b10100000n); // bits 7 and 5 set

console.log(`   Original: ${bits.toString()} (0b${bits.toString(2)})`);
console.log(`   Bit 7 set? ${testBit(bits, 7)}`);
console.log(`   Bit 6 set? ${testBit(bits, 6)}`);
console.log(`   Set bit 3: ${setBit(bits, 3).toString()} (0b${setBit(bits, 3).toString(2)})`);
console.log(`   Clear bit 7: ${clearBit(bits, 7).toString()} (0b${clearBit(bits, 7).toString(2)})`);
console.log(`   Toggle bit 5: ${toggleBit(bits, 5).toString()} (0b${toggleBit(bits, 5).toString(2)})\n`);

// 4. Masking operations
console.log('4. Masking Operations');
console.log('   -----------------');

const hexValue = Uint.fromHex('0x123456789abcdef');

console.log(`   Value: ${hexValue.toHex(false)}\n`);

const lowByte = hexValue.bitwiseAnd(Uint.fromHex('0xff'));
console.log(`   Extract low byte (& 0xFF): ${lowByte.toHex(false)}`);

const lowWord = hexValue.bitwiseAnd(Uint.fromHex('0xffff'));
console.log(`   Extract low word (& 0xFFFF): ${lowWord.toHex(false)}`);

const lowDword = hexValue.bitwiseAnd(Uint.fromHex('0xffffffff'));
console.log(`   Extract low dword (& 0xFFFFFFFF): ${lowDword.toHex(false)}\n`);

// 5. Flags and permissions
console.log('5. Flags and Permissions');
console.log('   --------------------');

// Define permission flags
const READ = Uint.from(0b001n);
const WRITE = Uint.from(0b010n);
const EXECUTE = Uint.from(0b100n);

// Set permissions
let perms = Uint.ZERO;
perms = perms.bitwiseOr(READ);
perms = perms.bitwiseOr(WRITE);

console.log(`   READ flag:    0b${READ.toString(2)}`);
console.log(`   WRITE flag:   0b${WRITE.toString(2)}`);
console.log(`   EXECUTE flag: 0b${EXECUTE.toString(2)}\n`);
console.log(`   Current permissions: 0b${perms.toString(2)}`);

// Check permissions
function hasPermission(permissions: typeof Uint.prototype, flag: typeof Uint.prototype): boolean {
	return !permissions.bitwiseAnd(flag).isZero();
}

console.log(`   Has READ? ${hasPermission(perms, READ)}`);
console.log(`   Has WRITE? ${hasPermission(perms, WRITE)}`);
console.log(`   Has EXECUTE? ${hasPermission(perms, EXECUTE)}\n`);

// Remove permission
perms = perms.bitwiseAnd(WRITE.bitwiseNot());
console.log(`   After removing WRITE: 0b${perms.toString(2)}`);
console.log(`   Has WRITE now? ${hasPermission(perms, WRITE)}\n`);

// 6. Power of 2 operations
console.log('6. Power of 2 Operations');
console.log('   --------------------');

function isPowerOfTwo(num: typeof Uint.prototype): boolean {
	if (num.isZero()) return false;
	// Power of 2 has only one bit set: n & (n-1) == 0
	return num.bitwiseAnd(num.minus(Uint.ONE)).isZero();
}

const testValues = [0n, 1n, 2n, 7n, 8n, 15n, 16n, 128n, 255n, 256n];

for (const val of testValues) {
	const testVal = Uint.from(val);
	console.log(`   ${val} is power of 2? ${isPowerOfTwo(testVal)}`);
}
console.log();

// 7. Extract bit range
console.log('7. Extract Bit Range');
console.log('   ----------------');

function extractBits(num: typeof Uint.prototype, start: number, length: number): typeof Uint.prototype {
	const mask = Uint.ONE.shiftLeft(length).minus(Uint.ONE);
	return num.shiftRight(start).bitwiseAnd(mask);
}

const data = Uint.fromHex('0xabcdef');
console.log(`   Value: ${data.toHex(false)}\n`);

const byte0 = extractBits(data, 0, 8);
const byte1 = extractBits(data, 8, 8);
const byte2 = extractBits(data, 16, 8);

console.log(`   Byte 0 (bits 0-7):   0x${byte0.toString(16)}`);
console.log(`   Byte 1 (bits 8-15):  0x${byte1.toString(16)}`);
console.log(`   Byte 2 (bits 16-23): 0x${byte2.toString(16)}\n`);

// 8. Overflow in shifts
console.log('8. Shift Overflow');
console.log('   -------------');

const one = Uint.ONE;
console.log(`   1 << 255 = ${one.shiftLeft(255).toHex(false)}`);
console.log(`   1 << 256 = ${one.shiftLeft(256).toString()} (shifts out, wraps to 0)`);
console.log(`   1 << 257 = ${one.shiftLeft(257).toString()} (shifts out, wraps to 0)\n`);

const large = Uint.from(2n ** 255n);
console.log(`   2^255 << 1 = ${large.shiftLeft(1).toString()} (wraps to 0)\n`);

console.log('=== Example Complete ===\n');
