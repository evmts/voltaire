import { Blake2 } from "../../../src/crypto/Blake2/index.js";
import { Ripemd160 } from "../../../src/crypto/Ripemd160/index.js";
import { SHA256 } from "../../../src/crypto/SHA256/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

const testData = new TextEncoder().encode("Test data for hashing");

const ripemd160Hash = Ripemd160.hash(testData);
const sha256Hash = SHA256.hash(testData);
const blake2Hash = Blake2.hash(testData, 20); // Same size as RIPEMD160
const blake2StandardHash = Blake2.hash(testData, 32); // Standard size

const sampleMessage = "Modern cryptographic hash";
const sampleBytes = new TextEncoder().encode(sampleMessage);

// RIPEMD160 (legacy)
const ripemd = Ripemd160.hash(sampleBytes);

// Blake2 with 20-byte output (modern, fast)
const blake20 = Blake2.hash(sampleBytes, 20);

// SHA-256 (standard)
const sha = SHA256.hash(sampleBytes);

// Blake2 with 32-byte output (modern, fast, standard size)
const blake32 = Blake2.hash(sampleBytes, 32);

const publicKeyExample = new Uint8Array(65).fill(0x04);

// Bitcoin's Hash160 = RIPEMD160(SHA256(data))
const step1 = SHA256.hash(publicKeyExample);
const hash160 = Ripemd160.hash(step1);
const modernStep1 = Blake2.hash(publicKeyExample, 32);
const modernStep2 = Blake2.hash(modernStep1, 20);
