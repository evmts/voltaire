// @title EIP-55 Checksum Address
// @description Convert addresses to EIP-55 checksummed format for safer usage

// SNIPPET:START
import { Address } from '../../src/primitives/Address/index.js';

// Lowercase address (no checksum)
const lowercaseAddr = '0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed';

// Convert to checksummed format
const addr = Address.from(lowercaseAddr);
const checksummed = Address.toChecksummed(addr);
console.log('Checksummed:', checksummed);

// Verify the checksum is valid
const isValid = Address.isValidChecksum(checksummed);
console.log('Is valid checksum:', isValid);

// Mixed case is preserved for checksum
console.log('Original:', lowercaseAddr);
console.log('Result:  ', checksummed);
// SNIPPET:END

// Test assertions
import { strict as assert } from 'node:assert';

assert.equal(Address.isValidChecksum(checksummed), true);
assert.equal(checksummed.toLowerCase(), lowercaseAddr.toLowerCase());
assert.equal(checksummed, '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed');

console.log('✅ All assertions passed');
process.exit(0);
