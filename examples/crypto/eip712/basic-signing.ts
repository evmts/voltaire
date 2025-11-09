/**
 * Basic EIP-712 Typed Data Signing
 *
 * Demonstrates:
 * - Defining typed data structures
 * - Domain separator
 * - Signing typed data
 * - Signature verification
 * - Address recovery
 */

import * as EIP712 from '../../../src/crypto/Eip712/index.js';
import * as Address from '../../../src/primitives/Address/index.js';
import { Hex } from '../../../src/primitives/Hex/index.js';

console.log('=== Basic EIP-712 Typed Data Signing ===\n');

// Generate private key for examples
const privateKey = new Uint8Array(32);
crypto.getRandomValues(privateKey);

// 1. Simple typed data
console.log('1. Simple Typed Data Structure');
console.log('-'.repeat(40));

const simpleTypedData = {
  domain: {
    name: 'My DApp',
    version: '1',
    chainId: 1n,
  },
  types: {
    Message: [
      { name: 'content', type: 'string' },
    ],
  },
  primaryType: 'Message',
  message: {
    content: 'Hello, EIP-712!',
  },
};

console.log('Typed data:');
console.log(JSON.stringify(simpleTypedData, null, 2));

const simpleHash = EIP712.hashTypedData(simpleTypedData);
console.log(`\nHash: ${Hex.fromBytes(simpleHash)}`);

const simpleSignature = EIP712.signTypedData(simpleTypedData, privateKey);
console.log('\nSignature:');
console.log(`  r: ${Hex.fromBytes(simpleSignature.r)}`);
console.log(`  s: ${Hex.fromBytes(simpleSignature.s)}`);
console.log(`  v: ${simpleSignature.v}\n`);

// 2. Recover signer address
console.log('2. Address Recovery');
console.log('-'.repeat(40));

const recoveredAddress = EIP712.recoverAddress(simpleSignature, simpleTypedData);

console.log(`Recovered address: ${Address.toHex(recoveredAddress)}\n`);

// 3. Verify signature
console.log('3. Signature Verification');
console.log('-'.repeat(40));

const isValid = EIP712.verifyTypedData(simpleSignature, simpleTypedData, recoveredAddress);
console.log(`Signature valid: ${isValid ? '✓' : '✗'}`);

// Wrong address fails
const wrongAddress = Address.fromHex('0x0000000000000000000000000000000000000000');
const wrongVerify = EIP712.verifyTypedData(simpleSignature, simpleTypedData, wrongAddress);
console.log(`Wrong address: ${wrongVerify ? '✗ Accepted' : '✓ Rejected'}\n`);

// 4. Complex typed data (nested structs)
console.log('4. Complex Typed Data (Nested Structs)');
console.log('-'.repeat(40));

const complexTypedData = {
  domain: {
    name: 'Ether Mail',
    version: '1',
    chainId: 1n,
    verifyingContract: Address.fromHex('0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'),
  },
  types: {
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person' },
      { name: 'contents', type: 'string' },
    ],
  },
  primaryType: 'Mail',
  message: {
    from: {
      name: 'Alice',
      wallet: Address.fromHex('0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826'),
    },
    to: {
      name: 'Bob',
      wallet: Address.fromHex('0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'),
    },
    contents: 'Hello, Bob!',
  },
};

console.log('Nested struct typed data:');
console.log(JSON.stringify(complexTypedData, null, 2));

const complexHash = EIP712.hashTypedData(complexTypedData);
const complexSignature = EIP712.signTypedData(complexTypedData, privateKey);

console.log(`\nHash: ${Hex.fromBytes(complexHash).slice(0, 32)}...`);
console.log(`Signature r: ${Hex.fromBytes(complexSignature.r).slice(0, 32)}...\n`);

// 5. Domain separator importance
console.log('5. Domain Separator (Prevents Replay)');
console.log('-'.repeat(40));

const message = { content: 'Same message' };

const domain1 = {
  domain: {
    name: 'App 1',
    version: '1',
    chainId: 1n,
  },
  types: { Message: [{ name: 'content', type: 'string' }] },
  primaryType: 'Message',
  message,
};

const domain2 = {
  domain: {
    name: 'App 2',
    version: '1',
    chainId: 1n,
  },
  types: { Message: [{ name: 'content', type: 'string' }] },
  primaryType: 'Message',
  message,
};

const hash1 = EIP712.hashTypedData(domain1);
const hash2 = EIP712.hashTypedData(domain2);

console.log('Same message, different domains:');
console.log(`Domain "App 1": ${Hex.fromBytes(hash1).slice(0, 32)}...`);
console.log(`Domain "App 2": ${Hex.fromBytes(hash2).slice(0, 32)}...`);
console.log(`Different hashes: ${Hex.fromBytes(hash1) !== Hex.fromBytes(hash2)}`);
console.log('\nDomain separator prevents cross-app signature replay\n');

// 6. Type encoding
console.log('6. Type Encoding');
console.log('-'.repeat(40));

const types = {
  Person: [
    { name: 'name', type: 'string' },
    { name: 'age', type: 'uint256' },
    { name: 'wallet', type: 'address' },
  ],
};

const typeEncoding = EIP712.encodeType('Person', types);
console.log(`Type encoding: ${typeEncoding}`);

const typeHash = EIP712.hashType('Person', types);
console.log(`Type hash: ${Hex.fromBytes(typeHash)}\n`);

// 7. Array handling
console.log('7. Array Types');
console.log('-'.repeat(40));

const arrayTypedData = {
  domain: {
    name: 'Array Example',
    version: '1',
    chainId: 1n,
  },
  types: {
    Numbers: [
      { name: 'values', type: 'uint256[]' },
    ],
  },
  primaryType: 'Numbers',
  message: {
    values: [1n, 2n, 3n, 4n, 5n],
  },
};

const arrayHash = EIP712.hashTypedData(arrayTypedData);
console.log('Array typed data:');
console.log(JSON.stringify(arrayTypedData.message, null, 2));
console.log(`\nHash: ${Hex.fromBytes(arrayHash).slice(0, 32)}...\n`);

// 8. All Solidity types
console.log('8. Supported Solidity Types');
console.log('-'.repeat(40));

const allTypesData = {
  domain: {
    name: 'All Types',
    version: '1',
    chainId: 1n,
  },
  types: {
    AllTypes: [
      { name: 'uintValue', type: 'uint256' },
      { name: 'intValue', type: 'int256' },
      { name: 'addressValue', type: 'address' },
      { name: 'boolValue', type: 'bool' },
      { name: 'bytesValue', type: 'bytes' },
      { name: 'bytes32Value', type: 'bytes32' },
      { name: 'stringValue', type: 'string' },
    ],
  },
  primaryType: 'AllTypes',
  message: {
    uintValue: 42n,
    intValue: -100n,
    addressValue: Address.fromHex('0x1234567890123456789012345678901234567890'),
    boolValue: true,
    bytesValue: new Uint8Array([0x01, 0x02, 0x03]),
    bytes32Value: new Uint8Array(32).fill(0xAB),
    stringValue: 'Hello',
  },
};

console.log('Supported types:');
console.log('✓ uint8, uint16, ..., uint256');
console.log('✓ int8, int16, ..., int256');
console.log('✓ address');
console.log('✓ bool');
console.log('✓ bytes1, bytes2, ..., bytes32');
console.log('✓ bytes (dynamic)');
console.log('✓ string');
console.log('✓ arrays (fixed and dynamic)');
console.log('✓ custom structs (nested)\n');

const allTypesHash = EIP712.hashTypedData(allTypesData);
console.log(`Hash of all types: ${Hex.fromBytes(allTypesHash).slice(0, 32)}...\n`);

// 9. Deterministic signatures
console.log('9. Deterministic Signatures');
console.log('-'.repeat(40));

const sig1 = EIP712.signTypedData(simpleTypedData, privateKey);
const sig2 = EIP712.signTypedData(simpleTypedData, privateKey);
const sig3 = EIP712.signTypedData(simpleTypedData, privateKey);

console.log('Same data + key produces identical signatures:');
console.log(`Signature 1: ${Hex.fromBytes(sig1.r).slice(0, 24)}...`);
console.log(`Signature 2: ${Hex.fromBytes(sig2.r).slice(0, 24)}...`);
console.log(`Signature 3: ${Hex.fromBytes(sig3.r).slice(0, 24)}...`);

const allMatch = Hex.fromBytes(sig1.r) === Hex.fromBytes(sig2.r) &&
                 Hex.fromBytes(sig2.r) === Hex.fromBytes(sig3.r);
console.log(`All identical: ${allMatch}\n`);

// 10. Security notes
console.log('10. Security Best Practices');
console.log('-'.repeat(40));

console.log('EIP-712 security:');
console.log('✓ Always include domain separator');
console.log('✓ Use verifyingContract in domain');
console.log('✓ Include chainId to prevent cross-chain replay');
console.log('✓ Validate typed data structure before signing');
console.log('✓ Use nonces for preventing replay attacks');
console.log('✓ Include deadlines for time-limited signatures');
console.log('✓ Human-readable signing (users see what they sign)');
console.log('✓ Type safety prevents signature over arbitrary data\n');

console.log('=== Complete ===');
