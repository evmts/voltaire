import * as Hex from '../../../primitives/Hex/index.js';

// Slice hex strings by byte offsets
const hex = '0x123456789abcdef0';
console.log('Original:', hex);
console.log('Size:', Hex.size(hex), 'bytes');

// Extract first 4 bytes
const first4 = Hex.slice(hex, 0, 4);
console.log('\nFirst 4 bytes:', first4);

// Extract last 4 bytes
const last4 = Hex.slice(hex, 4, 8);
console.log('Last 4 bytes:', last4);

// Slice from middle
const middle = Hex.slice(hex, 2, 6);
console.log('Middle bytes (2-6):', middle);

// Extract function selector (first 4 bytes of calldata)
const calldata = '0x70a08231000000000000000000000000742d35Cc6634C0532925a3b844Bc454e4438f44e';
const selector = Hex.slice(calldata, 0, 4);
const params = Hex.slice(calldata, 4);
console.log('\nCalldata:', calldata);
console.log('Function selector:', selector);
console.log('Parameters:', params);

// Negative offset (from end)
const fromEnd = Hex.slice(hex, -4);
console.log('\nLast 4 bytes (negative offset):', fromEnd);
