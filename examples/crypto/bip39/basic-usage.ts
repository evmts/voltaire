/**
 * Basic BIP-39 Usage
 *
 * Demonstrates:
 * - Mnemonic generation (12, 15, 18, 21, 24 words)
 * - Seed derivation from mnemonic
 * - Mnemonic validation
 * - Deterministic behavior
 * - Checksum verification
 */

import * as Bip39 from '../../../src/crypto/Bip39/index.js';
import { Hex } from '../../../src/primitives/Hex/index.js';

console.log('=== Basic BIP-39 Usage ===\n');

// 1. Generate mnemonics of different lengths
console.log('1. Mnemonic Generation (Different Lengths)');
console.log('-'.repeat(40));

const mnemonic12 = Bip39.generateMnemonic(128); // 12 words
const mnemonic15 = Bip39.generateMnemonic(160); // 15 words
const mnemonic18 = Bip39.generateMnemonic(192); // 18 words
const mnemonic21 = Bip39.generateMnemonic(224); // 21 words
const mnemonic24 = Bip39.generateMnemonic(256); // 24 words (recommended)

console.log('Generated mnemonics:\n');
console.log(`12 words (128-bit): ${mnemonic12}`);
console.log(`15 words (160-bit): ${mnemonic15.split(' ').slice(0, 5).join(' ')}...`);
console.log(`18 words (192-bit): ${mnemonic18.split(' ').slice(0, 5).join(' ')}...`);
console.log(`21 words (224-bit): ${mnemonic21.split(' ').slice(0, 5).join(' ')}...`);
console.log(`24 words (256-bit): ${mnemonic24.split(' ').slice(0, 5).join(' ')}...\n`);

console.log('Word counts:');
console.log(`12 words: ${mnemonic12.split(' ').length}`);
console.log(`15 words: ${mnemonic15.split(' ').length}`);
console.log(`18 words: ${mnemonic18.split(' ').length}`);
console.log(`21 words: ${mnemonic21.split(' ').length}`);
console.log(`24 words: ${mnemonic24.split(' ').length}\n`);

// 2. Mnemonic to seed conversion
console.log('2. Mnemonic to Seed Conversion');
console.log('-'.repeat(40));

// Use shorter mnemonic for example
const exampleMnemonic = mnemonic12;
console.log(`Mnemonic: ${exampleMnemonic}\n`);

// Derive seed (async)
const seed = await Bip39.mnemonicToSeed(exampleMnemonic);
console.log(`Seed (async):  ${Hex.fromBytes(seed)}`);
console.log(`Seed length: ${seed.length} bytes (${seed.length * 8} bits)`);

// Derive seed (sync)
const seedSync = Bip39.mnemonicToSeedSync(exampleMnemonic);
console.log(`Seed (sync):   ${Hex.fromBytes(seedSync)}`);
console.log(`Seeds match: ${Hex.fromBytes(seed) === Hex.fromBytes(seedSync)}\n`);

// 3. Mnemonic validation
console.log('3. Mnemonic Validation');
console.log('-'.repeat(40));

const validMnemonic = mnemonic12;
const isValid = Bip39.validateMnemonic(validMnemonic);
console.log(`Valid mnemonic: ${isValid ? '✓' : '✗'}`);

// Invalid: wrong word
const invalidWord = validMnemonic.split(' ');
invalidWord[0] = 'notarealword';
const wrongWord = invalidWord.join(' ');
console.log(`Wrong word: ${Bip39.validateMnemonic(wrongWord) ? '✗ Accepted' : '✓ Rejected'}`);

// Invalid: wrong word count
const wrongCount = validMnemonic.split(' ').slice(0, 5).join(' ');
console.log(`Wrong count (5 words): ${Bip39.validateMnemonic(wrongCount) ? '✗ Accepted' : '✓ Rejected'}`);

// Invalid: wrong checksum
const wrongChecksum = validMnemonic.split(' ');
wrongChecksum[wrongChecksum.length - 1] = 'abandon'; // Change last word (checksum)
const badChecksum = wrongChecksum.join(' ');
console.log(`Wrong checksum: ${Bip39.validateMnemonic(badChecksum) ? '✗ Accepted' : '✓ Rejected'}\n`);

// 4. Deterministic seed derivation
console.log('4. Deterministic Seed Derivation');
console.log('-'.repeat(40));

const testMnemonic = mnemonic12;

const seed1 = await Bip39.mnemonicToSeed(testMnemonic);
const seed2 = await Bip39.mnemonicToSeed(testMnemonic);
const seed3 = await Bip39.mnemonicToSeed(testMnemonic);

console.log('Same mnemonic produces identical seeds:');
console.log(`Seed 1: ${Hex.fromBytes(seed1).slice(0, 32)}...`);
console.log(`Seed 2: ${Hex.fromBytes(seed2).slice(0, 32)}...`);
console.log(`Seed 3: ${Hex.fromBytes(seed3).slice(0, 32)}...`);

const allMatch = Hex.fromBytes(seed1) === Hex.fromBytes(seed2) &&
                 Hex.fromBytes(seed2) === Hex.fromBytes(seed3);
console.log(`All identical: ${allMatch}\n`);

// 5. Passphrase support
console.log('5. Passphrase Support (BIP-39 Extension)');
console.log('-'.repeat(40));

const baseMnemonic = mnemonic12;

const seedNoPass = await Bip39.mnemonicToSeed(baseMnemonic);
const seedPass1 = await Bip39.mnemonicToSeed(baseMnemonic, 'password1');
const seedPass2 = await Bip39.mnemonicToSeed(baseMnemonic, 'password2');
const seedEmptyPass = await Bip39.mnemonicToSeed(baseMnemonic, '');

console.log('Same mnemonic, different passphrases:');
console.log(`No passphrase:    ${Hex.fromBytes(seedNoPass).slice(0, 32)}...`);
console.log(`Passphrase "password1": ${Hex.fromBytes(seedPass1).slice(0, 32)}...`);
console.log(`Passphrase "password2": ${Hex.fromBytes(seedPass2).slice(0, 32)}...`);
console.log(`Empty passphrase: ${Hex.fromBytes(seedEmptyPass).slice(0, 32)}...`);

console.log(`\nNo passphrase === Empty passphrase: ${Hex.fromBytes(seedNoPass) === Hex.fromBytes(seedEmptyPass)}`);
console.log(`Different passphrases produce different seeds: ${Hex.fromBytes(seedPass1) !== Hex.fromBytes(seedPass2)}\n`);

// 6. Entropy to mnemonic
console.log('6. Entropy to Mnemonic Conversion');
console.log('-'.repeat(40));

const entropy = crypto.getRandomValues(new Uint8Array(32)); // 256 bits
const mnemonicFromEntropy = Bip39.entropyToMnemonic(entropy);

console.log(`Entropy (256 bits): ${Hex.fromBytes(entropy)}`);
console.log(`Mnemonic: ${mnemonicFromEntropy}`);
console.log(`Word count: ${mnemonicFromEntropy.split(' ').length}`);
console.log(`Valid: ${Bip39.validateMnemonic(mnemonicFromEntropy)}\n`);

// 7. Helper functions
console.log('7. Helper Functions');
console.log('-'.repeat(40));

console.log('Entropy bits to word count:');
console.log(`  128 bits → ${Bip39.getWordCount(128)} words`);
console.log(`  160 bits → ${Bip39.getWordCount(160)} words`);
console.log(`  192 bits → ${Bip39.getWordCount(192)} words`);
console.log(`  224 bits → ${Bip39.getWordCount(224)} words`);
console.log(`  256 bits → ${Bip39.getWordCount(256)} words`);

console.log('\nWord count to entropy bits:');
console.log(`  12 words → ${Bip39.getEntropyBits(12)} bits`);
console.log(`  15 words → ${Bip39.getEntropyBits(15)} bits`);
console.log(`  18 words → ${Bip39.getEntropyBits(18)} bits`);
console.log(`  21 words → ${Bip39.getEntropyBits(21)} bits`);
console.log(`  24 words → ${Bip39.getEntropyBits(24)} bits\n`);

// 8. Constants
console.log('8. BIP-39 Constants');
console.log('-'.repeat(40));

console.log(`ENTROPY_128: ${Bip39.ENTROPY_128} bits (12 words)`);
console.log(`ENTROPY_160: ${Bip39.ENTROPY_160} bits (15 words)`);
console.log(`ENTROPY_192: ${Bip39.ENTROPY_192} bits (18 words)`);
console.log(`ENTROPY_224: ${Bip39.ENTROPY_224} bits (21 words)`);
console.log(`ENTROPY_256: ${Bip39.ENTROPY_256} bits (24 words)`);
console.log(`SEED_LENGTH: ${Bip39.SEED_LENGTH} bytes\n`);

// 9. Test vector (BIP-39 spec)
console.log('9. BIP-39 Test Vector');
console.log('-'.repeat(40));

const testVector = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const testSeed = await Bip39.mnemonicToSeed(testVector, 'TREZOR');

console.log(`Mnemonic: ${testVector}`);
console.log(`Passphrase: "TREZOR"`);
console.log(`Seed: ${Hex.fromBytes(testSeed).slice(0, 64)}...`);
console.log(`Valid: ${Bip39.validateMnemonic(testVector)}\n`);

// 10. Security notes
console.log('10. Security Recommendations');
console.log('-'.repeat(40));

console.log('Mnemonic security:');
console.log('✓ Use 24-word mnemonics (256-bit) for high-value wallets');
console.log('✓ Use 12-word mnemonics (128-bit) for convenience/low-value');
console.log('✓ Store mnemonics offline (paper, metal)');
console.log('✓ Never store mnemonics digitally unencrypted');
console.log('✓ Verify backups by restoring test wallet');
console.log('✓ Keep passphrases separate from mnemonics');
console.log('✓ Use strong passphrases for additional security');
console.log('✓ Never share mnemonics or passphrases');
console.log('✓ Forgetting passphrase = permanent loss\n');

console.log('=== Complete ===');
