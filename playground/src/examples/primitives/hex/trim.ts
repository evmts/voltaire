import * as Hex from '../../../primitives/Hex/index.js';

// Remove leading zeros from hex
const padded = '0x000000000000000000000000000000000000000000000000000000000000002a';
const trimmed = Hex.trim(padded);
console.log('Padded:', padded);
console.log('Trimmed:', trimmed);
console.log('Padded size:', Hex.size(padded), 'bytes');
console.log('Trimmed size:', Hex.size(trimmed), 'bytes');

// Trim address from padded calldata parameter
const paddedAddress = '0x000000000000000000000000742d35Cc6634C0532925a3b844Bc454e4438f44e';
const address = Hex.trim(paddedAddress);
console.log('\nPadded address:', paddedAddress);
console.log('Trimmed address:', address);

// All zeros
const zeros = '0x0000000000';
const trimmedZeros = Hex.trim(zeros);
console.log('\nAll zeros:', zeros);
console.log('Trimmed:', trimmedZeros);

// No leading zeros
const noZeros = '0xdeadbeef';
const unchanged = Hex.trim(noZeros);
console.log('\nNo leading zeros:', noZeros);
console.log('After trim:', unchanged);
console.log('Unchanged:', noZeros === unchanged);

// Round-trip pad and trim
const original = '0x1234';
const padded32 = Hex.pad(original, 32);
const restored = Hex.trim(padded32);
console.log('\nOriginal:', original);
console.log('Padded:', padded32);
console.log('Restored:', restored);
console.log('Match:', original === restored);
