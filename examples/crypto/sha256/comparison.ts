/**
 * SHA256 vs Keccak256 Comparison
 *
 * Demonstrates differences and use cases:
 * - Algorithm differences
 * - Performance comparison
 * - When to use each
 * - Cross-validation with known values
 */

import { Keccak256 } from "../../../src/crypto/Keccak256/Keccak256.js";
import { SHA256 } from "../../../src/crypto/SHA256/SHA256.js";
import { Bytes, Bytes64 } from "../../../src/primitives/Bytes/index.js";

const data = new TextEncoder().encode("Hello, World!");

const sha256Hash = SHA256.hash(data);
const keccak256Hash = Keccak256(data);

const emptySha256 = SHA256.hashString("");
const emptyKeccak256 = Keccak256("");

// Bitcoin uses SHA-256 (double)
function bitcoinHash(data: Uint8Array): Uint8Array {
	return SHA256.hash(SHA256.hash(data));
}

// Ethereum uses Keccak-256
function ethereumHash(data: Uint8Array): Uint8Array {
	return Keccak256(data);
}

const blockData = new TextEncoder().encode("Block header data");

const bitcoinBlockHash = bitcoinHash(blockData);
const ethereumBlockHash = ethereumHash(blockData);

const functionSig = "transfer(address,uint256)";
const functionBytes = new TextEncoder().encode(functionSig);

// Ethereum uses Keccak-256 for function selectors
const keccakHash = Keccak256(functionBytes);
const selector = keccakHash.slice(0, 4);

// If we used SHA-256 (WRONG for Ethereum!)
const wrongHash = SHA256.hash(functionBytes);
const wrongSelector = wrongHash.slice(0, 4);

// Simulated public key
const publicKey = Bytes.from(Array.from({ length: 64 }, (_, i) => i & 0xff));
const bitcoinStep1 = SHA256.hash(publicKey);
const ethereumStep1 = Keccak256(publicKey);
const ethereumAddress = ethereumStep1.slice(12);

const testData = Bytes.from(
	Array.from({ length: 1024 * 1024 }, (_, i) => i & 0xff),
); // 1MB

const iterations = 10;

// SHA-256 benchmark
const sha256Start = performance.now();
for (let i = 0; i < iterations; i++) {
	SHA256.hash(testData);
}
const sha256Time = (performance.now() - sha256Start) / iterations;

// Keccak-256 benchmark
const keccak256Start = performance.now();
for (let i = 0; i < iterations; i++) {
	Keccak256(testData);
}
const keccak256Time = (performance.now() - keccak256Start) / iterations;

const faster = sha256Time < keccak256Time ? "SHA-256" : "Keccak-256";
const ratio = (
	Math.max(sha256Time, keccak256Time) / Math.min(sha256Time, keccak256Time)
).toFixed(2);

const input1 = Bytes.from([1, 2, 3, 4, 5]);
const input2 = Bytes.from([1, 2, 3, 4, 6]); // Last byte different

const sha1 = SHA256.hash(input1);
const sha2 = SHA256.hash(input2);
const kec1 = Keccak256(input1);
const kec2 = Keccak256(input2);

// Count differing bits for SHA-256
let shaDiff = 0;
for (let i = 0; i < 32; i++) {
	const xor = sha1[i] ^ sha2[i];
	shaDiff += xor.toString(2).split("1").length - 1;
}

// Count differing bits for Keccak-256
let kecDiff = 0;
for (let i = 0; i < 32; i++) {
	const xor = kec1[i] ^ kec2[i];
	kecDiff += kec2.toString(2).split("1").length - 1;
}
