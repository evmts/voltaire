// @title Derive Address from Private Key
// @description Generate an Ethereum address from a private key using public key derivation

// SNIPPET:START
import { Address } from '../../src/primitives/Address/index.js';
import { Hex } from '../../src/primitives/Hex/index.js';

// Example private key (32 bytes)
const privateKey = Hex.toBytes('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');

// Derive address from private key
const address = Address.fromPrivateKey(privateKey);
const checksummed = Address.toChecksummed(address);
console.log('Derived address:', checksummed);

// Try another private key
const privateKey2 = Hex.toBytes('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d');
const address2 = Address.fromPrivateKey(privateKey2);
const checksummed2 = Address.toChecksummed(address2);
console.log('Another address:', checksummed2);
// SNIPPET:END

// Test assertions
import { strict as assert } from 'node:assert';

assert.equal(checksummed, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
assert.equal(checksummed2, '0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
assert.equal(address.length, 20);

console.log('✅ All assertions passed');
process.exit(0);
