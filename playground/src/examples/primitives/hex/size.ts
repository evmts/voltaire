import * as Hex from '../../../primitives/Hex/index.js';

// Get size in bytes of hex strings
const hex1 = '0x1234';
console.log('Hex:', hex1);
console.log('Size:', Hex.size(hex1), 'bytes');
console.log('Characters (with 0x):', hex1.length);

const hex2 = '0xdeadbeef';
console.log('\nHex:', hex2);
console.log('Size:', Hex.size(hex2), 'bytes');

// Address (20 bytes)
const address = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
console.log('\nAddress:', address);
console.log('Size:', Hex.size(address), 'bytes');

// Hash (32 bytes)
const hash = '0x' + '42'.repeat(32);
console.log('\nHash:', hash);
console.log('Size:', Hex.size(hash), 'bytes');

// Empty
const empty = '0x';
console.log('\nEmpty:', empty);
console.log('Size:', Hex.size(empty), 'bytes');

// Without prefix
const noPrefix = 'deadbeef';
console.log('\nNo prefix:', noPrefix);
console.log('Size:', Hex.size(noPrefix), 'bytes');

// Size relationship: 2 hex chars = 1 byte
const testHex = '0xaabbccdd';
const sizeInBytes = Hex.size(testHex);
const hexChars = testHex.length - 2; // Remove '0x'
console.log('\nHex:', testHex);
console.log('Hex chars (without 0x):', hexChars);
console.log('Size in bytes:', sizeInBytes);
console.log('Relationship: bytes = chars / 2:', sizeInBytes === hexChars / 2);
