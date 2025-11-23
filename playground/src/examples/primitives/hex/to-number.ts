import * as Hex from '../../../primitives/Hex/index.js';

// Convert hex to number
const hex1 = '0xff';
const num1 = Hex.toNumber(hex1);
console.log('Hex:', hex1);
console.log('Number:', num1);

// Larger values
const hex2 = '0xf4240'; // 1,000,000
const num2 = Hex.toNumber(hex2);
console.log('\nHex:', hex2);
console.log('Number:', num2);

// Leading zeros
const hex3 = '0x00002a'; // 42
const num3 = Hex.toNumber(hex3);
console.log('\nHex:', hex3);
console.log('Number:', num3);

// Round-trip conversion
const original = 12345;
const hexed = Hex.fromNumber(original);
const restored = Hex.toNumber(hexed);
console.log('\nOriginal number:', original);
console.log('Hex:', hexed);
console.log('Restored:', restored);
console.log('Match:', original === restored);

// Zero
const zero = Hex.toNumber('0x00');
console.log('\nZero hex to number:', zero);
