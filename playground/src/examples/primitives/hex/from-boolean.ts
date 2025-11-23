import * as Hex from '../../../primitives/Hex/index.js';

// Convert boolean to hex (0x01 for true, 0x00 for false)
const hexTrue = Hex.fromBoolean(true);
const hexFalse = Hex.fromBoolean(false);

console.log('Boolean true to hex:', hexTrue);
console.log('Boolean false to hex:', hexFalse);

// Round-trip conversion
const backToTrue = Hex.toBoolean(hexTrue);
const backToFalse = Hex.toBoolean(hexFalse);

console.log('\nRound-trip true:', backToTrue);
console.log('Round-trip false:', backToFalse);

// In calldata encoding
const encodedTrue = Hex.pad(hexTrue, 32);
const encodedFalse = Hex.pad(hexFalse, 32);

console.log('\nPadded true (32 bytes):', encodedTrue);
console.log('Padded false (32 bytes):', encodedFalse);

// Multiple boolean flags
const flags = [true, false, true, true, false];
const hexFlags = flags.map(Hex.fromBoolean);
console.log('\nBoolean flags:', flags);
console.log('Hex flags:', hexFlags);
