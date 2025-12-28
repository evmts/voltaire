import { Bip39, Bytes, Hex } from "@tevm/voltaire";
// Convert raw entropy to BIP-39 mnemonic

// 16 bytes (128 bits) = 12 words
const entropy16 = Bytes.zero(16);
const mnemonic12 = Bip39.entropyToMnemonic(entropy16);

// 32 bytes (256 bits) = 24 words
const entropy32 = Bytes.zero(32);
const mnemonic24 = Bip39.entropyToMnemonic(entropy32);

// Random entropy produces valid mnemonic
const randomEntropy = Bytes.random(32);
const randomMnemonic = Bip39.entropyToMnemonic(randomEntropy);

// Sequential entropy
const sequential = Bytes(Array.from({ length: 16 }, (_, i) => i));
const sequentialMnemonic = Bip39.entropyToMnemonic(sequential);

// Deterministic - same entropy always produces same mnemonic
const testEntropy = Bytes([0x42, ...Array(15).fill(0)]);
const m1 = Bip39.entropyToMnemonic(testEntropy);
const m2 = Bip39.entropyToMnemonic(testEntropy);

// Different entropy produces different mnemonics
const e1 = Bytes(Array(16).fill(1));
const e2 = Bytes(Array(16).fill(2));
