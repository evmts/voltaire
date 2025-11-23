import * as Hex from '../../../primitives/Hex/index.js';

// Convert hex to boolean (0x00 = false, anything else = true)
const hexFalse = '0x00';
const hexTrue = '0x01';

console.log('Hex 0x00 to boolean:', Hex.toBoolean(hexFalse));
console.log('Hex 0x01 to boolean:', Hex.toBoolean(hexTrue));

// Non-zero values are truthy
const nonZero = '0xff';
console.log('\nHex 0xff to boolean:', Hex.toBoolean(nonZero));

const hex42 = '0x2a';
console.log('Hex 0x2a to boolean:', Hex.toBoolean(hex42));

// Padded values
const paddedFalse = '0x0000000000000000000000000000000000000000000000000000000000000000';
const paddedTrue = '0x0000000000000000000000000000000000000000000000000000000000000001';

console.log('\nPadded false:', Hex.toBoolean(paddedFalse));
console.log('Padded true:', Hex.toBoolean(paddedTrue));

// Round-trip
const original = true;
const hexed = Hex.fromBoolean(original);
const restored = Hex.toBoolean(hexed);

console.log('\nOriginal boolean:', original);
console.log('As hex:', hexed);
console.log('Restored:', restored);
console.log('Match:', original === restored);
