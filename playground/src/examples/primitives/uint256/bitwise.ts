import * as Uint256 from '../../../../../src/primitives/Uint/index.js';

// Bitwise AND
const a = Uint256.fromNumber(0b1100);
const b = Uint256.fromNumber(0b1010);
const and = Uint256.bitwiseAnd(a, b);
console.log('1100 & 1010 =', Uint256.toNumber(and).toString(2).padStart(4, '0'));

// Bitwise OR
const or = Uint256.bitwiseOr(a, b);
console.log('1100 | 1010 =', Uint256.toNumber(or).toString(2).padStart(4, '0'));

// Bitwise XOR
const xor = Uint256.bitwiseXor(a, b);
console.log('1100 ^ 1010 =', Uint256.toNumber(xor).toString(2).padStart(4, '0'));

// Bitwise NOT
const value = Uint256.fromNumber(0);
const not = Uint256.bitwiseNot(value);
console.log('NOT 0 = MAX:', Uint256.equals(not, Uint256.MAX));

// Clear specific bits with AND
const flags = Uint256.fromNumber(0b11111111);
const mask = Uint256.fromNumber(0b11110000);
const cleared = Uint256.bitwiseAnd(flags, mask);
console.log('Clear lower 4 bits:', Uint256.toNumber(cleared).toString(2));

// Set specific bits with OR
const setBits = Uint256.bitwiseOr(Uint256.fromNumber(0b10000000), Uint256.fromNumber(0b00000001));
console.log('Set bits 0 and 7:', Uint256.toNumber(setBits).toString(2));

// Toggle bits with XOR
const toggle = Uint256.bitwiseXor(Uint256.fromNumber(0b11110000), Uint256.fromNumber(0b00001111));
console.log('Toggle all bits:', Uint256.toNumber(toggle).toString(2));
