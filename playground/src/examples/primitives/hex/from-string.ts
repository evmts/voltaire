import * as Hex from '../../../primitives/Hex/index.js';

// Convert UTF-8 strings to hex encoding
const message = 'Hello, Ethereum!';
const hex = Hex.fromString(message);
console.log('Original string:', message);
console.log('Hex encoded:', hex);
console.log('Byte size:', Hex.size(hex));

// Emoji and Unicode support
const emoji = Hex.fromString('🚀 Voltaire');
console.log('\nEmoji hex:', emoji);

// Empty string
const empty = Hex.fromString('');
console.log('\nEmpty string hex:', empty);
