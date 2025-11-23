import * as Address from '../../../primitives/Address/index.js';

// Example: Type guard usage
const validAddr = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
const invalidAddr = '0x123';
const number = 42;

// Type guard narrows the type
if (Address.is(validAddr)) {
  console.log('Valid address detected:', Address.toHex(validAddr));
}

if (!Address.is(invalidAddr)) {
  console.log('Invalid address rejected');
}

if (!Address.is(number)) {
  console.log('Non-address type rejected');
}

// Use in type narrowing
function processAddress(input: unknown) {
  if (Address.is(input)) {
    // TypeScript knows input is AddressType here
    return Address.toHex(input);
  }
  throw new Error('Not an address');
}

const addr = Address.from(validAddr);
console.log('Processed:', processAddress(addr));
