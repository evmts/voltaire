/**
 * SHA256 NIST Test Vectors
 *
 * Validates implementation against official NIST FIPS 180-4 test vectors:
 * - Empty string
 * - Short messages
 * - Messages at block boundaries
 * - Large messages (1 million 'a' characters)
 */

import { SHA256 } from '../../../src/crypto/sha256/SHA256.js';

console.log('=== SHA256 NIST Test Vectors ===\n');

interface TestVector {
  name: string;
  input: string;
  expected: string;
}

const testVectors: TestVector[] = [
  {
    name: 'Empty string',
    input: '',
    expected: '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  {
    name: 'abc',
    input: 'abc',
    expected: '0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  },
  {
    name: 'hello world',
    input: 'hello world',
    expected: '0xb94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
  },
  {
    name: '448-bit message',
    input: 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
    expected: '0x248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
  },
  {
    name: '896-bit message',
    input: 'abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu',
    expected: '0xcf5b16a778af8380036ce59e7b0492370b249b11e8f07a51afac45037afee9d1',
  },
];

console.log('Running NIST FIPS 180-4 test vectors...\n');

let passed = 0;
let failed = 0;

for (const vector of testVectors) {
  console.log(`Test: ${vector.name}`);
  console.log('-'.repeat(70));

  const hash = SHA256.hashString(vector.input);
  const result = SHA256.toHex(hash);

  const isMatch = result === vector.expected;

  if (vector.input.length <= 50) {
    console.log('Input:   ', `"${vector.input}"`);
  } else {
    console.log('Input:   ', `"${vector.input.slice(0, 47)}..." (${vector.input.length} bytes)`);
  }
  console.log('Expected:', vector.expected);
  console.log('Got:     ', result);
  console.log('Status:  ', isMatch ? '✓ PASS' : '✗ FAIL');

  if (isMatch) {
    passed++;
  } else {
    failed++;
  }

  console.log();
}

// Special test: One million 'a' characters
console.log('Test: One million "a" characters');
console.log('-'.repeat(70));

const largeInput = 'a'.repeat(1000000);
const largeExpected = '0xcdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0';

console.log('Input:    1,000,000 × "a"');
console.log('Expected:', largeExpected);

const start = performance.now();
const largeHash = SHA256.hashString(largeInput);
const elapsed = performance.now() - start;

const largeResult = SHA256.toHex(largeHash);
const isLargeMatch = largeResult === largeExpected;

console.log('Got:     ', largeResult);
console.log('Time:    ', elapsed.toFixed(2), 'ms');
console.log('Status:  ', isLargeMatch ? '✓ PASS' : '✗ FAIL');

if (isLargeMatch) {
  passed++;
} else {
  failed++;
}

console.log();

// Test with streaming API (should produce same result)
console.log('Test: Streaming API validation');
console.log('-'.repeat(70));

const hasher = SHA256.create();
const chunkSize = 10000;
for (let i = 0; i < 100; i++) {
  hasher.update(new TextEncoder().encode('a'.repeat(chunkSize)));
}
const streamingHash = hasher.digest();
const streamingResult = SHA256.toHex(streamingHash);

console.log('Input:    1,000,000 × "a" (streamed in 10KB chunks)');
console.log('Expected:', largeExpected);
console.log('Got:     ', streamingResult);
console.log('Status:  ', streamingResult === largeExpected ? '✓ PASS' : '✗ FAIL');

if (streamingResult === largeExpected) {
  passed++;
} else {
  failed++;
}

console.log();

// Edge case tests
console.log('Edge Case Tests');
console.log('-'.repeat(70));

const edgeCases = [
  {
    name: 'Single byte (0x00)',
    input: new Uint8Array([0x00]),
    expected: '0x6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d',
  },
  {
    name: 'All zeros (32 bytes)',
    input: new Uint8Array(32).fill(0x00),
    expected: '0x66687aadf862bd776c8fc18b8e9f8e20089714856ee233b3902a591d0d5f2925',
  },
  {
    name: 'All ones (32 bytes)',
    input: new Uint8Array(32).fill(0xFF),
    expected: '0xaf9613760f72635fbdb44a5a0a63c39f12af30f950a6ee5c971be188e89c4051',
  },
];

for (const test of edgeCases) {
  const hash = SHA256.hash(test.input);
  const result = SHA256.toHex(hash);
  const isMatch = result === test.expected;

  console.log(`${test.name}:`, isMatch ? '✓ PASS' : '✗ FAIL');
  if (!isMatch) {
    console.log('  Expected:', test.expected);
    console.log('  Got:     ', result);
  }

  if (isMatch) {
    passed++;
  } else {
    failed++;
  }
}

console.log();

// Unicode tests
console.log('Unicode Tests');
console.log('-'.repeat(70));

const unicodeTests = [
  {
    name: 'Emoji 🚀',
    input: '🚀',
    // UTF-8: F0 9F 9A 80
    bytes: new Uint8Array([0xF0, 0x9F, 0x9A, 0x80]),
  },
  {
    name: 'Chinese 你好',
    input: '你好',
    // UTF-8: E4 BD A0 E5 A5 BD
    bytes: new Uint8Array([0xE4, 0xBD, 0xA0, 0xE5, 0xA5, 0xBD]),
  },
];

for (const test of unicodeTests) {
  const stringHash = SHA256.hashString(test.input);
  const bytesHash = SHA256.hash(test.bytes);
  const isMatch = SHA256.toHex(stringHash) === SHA256.toHex(bytesHash);

  console.log(`${test.name}:`, isMatch ? '✓ PASS' : '✗ FAIL');
  console.log('  UTF-8 bytes:', Array.from(test.bytes).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
  console.log('  Hash:       ', SHA256.toHex(stringHash).slice(0, 40) + '...');

  if (isMatch) {
    passed++;
  } else {
    failed++;
  }
}

console.log();

// Summary
console.log('='.repeat(70));
console.log('Test Summary');
console.log('='.repeat(70));
console.log('Total tests: ', passed + failed);
console.log('Passed:      ', passed, '✓');
console.log('Failed:      ', failed, failed > 0 ? '✗' : '');

if (failed === 0) {
  console.log('\n🎉 All tests passed! Implementation is correct.');
} else {
  console.log('\n⚠️  Some tests failed. Check implementation.');
}

console.log();
console.log('=== Test Vectors Complete ===');
