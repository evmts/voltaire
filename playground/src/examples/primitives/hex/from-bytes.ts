import * as Hex from '../../../primitives/Hex/index.js';

// Convert Uint8Array to hex string
const bytes = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0]);
const hex = Hex.fromBytes(bytes);
console.log('Bytes:', bytes);
console.log('Hex:', hex);

// Zero bytes
const zeros = new Uint8Array(32);
const zeroHex = Hex.fromBytes(zeros);
console.log('\n32 zero bytes:', zeroHex);

// Single byte
const single = Hex.fromBytes(new Uint8Array([0xff]));
console.log('\nSingle byte (0xff):', single);
