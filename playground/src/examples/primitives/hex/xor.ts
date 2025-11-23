import * as Hex from '../../../primitives/Hex/index.js';

// XOR two hex values (bitwise exclusive OR)
const hex1 = '0xff00ff00';
const hex2 = '0x00ff00ff';
const result = Hex.xor(hex1, hex2);
console.log('Hex 1:', hex1);
console.log('Hex 2:', hex2);
console.log('XOR result:', result);

// XOR with all zeros (identity)
const data = '0xdeadbeef';
const zeros = '0x00000000';
const identity = Hex.xor(data, zeros);
console.log('\nData:', data);
console.log('XOR with zeros:', identity);
console.log('Unchanged:', data === identity);

// XOR with all ones (bitwise NOT)
const ones = '0xffffffff';
const inverted = Hex.xor(data, ones);
console.log('\nXOR with all ones:', inverted);

// XOR twice (returns original)
const encrypted = Hex.xor(data, hex1);
const decrypted = Hex.xor(encrypted, hex1);
console.log('\nOriginal:', data);
console.log('XOR with key:', encrypted);
console.log('XOR again:', decrypted);
console.log('Match:', data === decrypted);

// Masking bits
const mask = '0x0000ffff'; // Keep lower 16 bits
const masked = Hex.xor('0xdeadbeef', Hex.xor('0xdead0000', '0xdead0000'));
console.log('\nMask example:', mask);
console.log('Result:', masked);
