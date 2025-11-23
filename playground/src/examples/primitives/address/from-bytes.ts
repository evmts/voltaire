import * as Address from '../../../primitives/Address/index.js';

// Example: Create address from byte array
const bytes = new Uint8Array([
  0x74, 0x2d, 0x35, 0xcc, 0x66, 0x34, 0xc0, 0x53,
  0x29, 0x25, 0xa3, 0xb8, 0x44, 0xbc, 0x45, 0x4e,
  0x44, 0x38, 0xf4, 0x4e
]);

const addr = Address.fromBytes(bytes);
console.log('Address from bytes:', Address.toHex(addr));
console.log('Byte length:', bytes.length);

// Can also use Address.from() with bytes
const addr2 = Address.from(bytes);
console.log('Using from():', Address.toHex(addr2));
console.log('Identical:', Address.equals(addr, addr2));

// Partial bytes (less than 20) are left-padded with zeros
const partial = new Uint8Array([0x01, 0x02, 0x03]);
const padded = Address.fromBytes(partial);
console.log('Padded address:', Address.toHex(padded));
