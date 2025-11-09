import { Ripemd160 } from "../../../src/crypto/Ripemd160/index.js";
import { SHA256 } from "../../../src/crypto/SHA256/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

// Simulate a Bitcoin public key (33 bytes compressed or 65 bytes uncompressed)
const publicKey = new Uint8Array(65);
publicKey[0] = 0x04; // Uncompressed public key prefix
// Fill with example data (in reality, this comes from ECDSA secp256k1)
for (let i = 1; i < 65; i++) {
	publicKey[i] = i % 256;
}

// Step 2: SHA-256 hash of public key
const sha256Hash = SHA256.hash(publicKey);

// Step 3: RIPEMD160 hash of SHA-256 result
const pubKeyHash = Ripemd160.hash(sha256Hash);

// Simulate a redeem script (e.g., 2-of-3 multisig)
const redeemScript = new Uint8Array([
	0x52, // OP_2
	0x21,
	0x03,
	...new Uint8Array(32).fill(0xaa), // Pubkey 1
	0x21,
	0x03,
	...new Uint8Array(32).fill(0xbb), // Pubkey 2
	0x21,
	0x03,
	...new Uint8Array(32).fill(0xcc), // Pubkey 3
	0x53, // OP_3
	0xae, // OP_CHECKMULTISIG
]);

// Step 1: SHA-256 of redeem script
const scriptSha256 = SHA256.hash(redeemScript);

// Step 2: RIPEMD160 of SHA-256 result
const scriptHash = Ripemd160.hash(scriptSha256);

const addressSpace = 2n ** 160n; // Total possible addresses

function hash160(data: Uint8Array): Uint8Array {
	const sha256 = SHA256.hash(data);
	return Ripemd160.hash(sha256);
}

const testData = new TextEncoder().encode("test data");
const hash160Result = hash160(testData);

// Three different public keys
const pubKey1 = new Uint8Array(33).fill(0x02);
pubKey1[0] = 0x02; // Compressed key prefix
pubKey1[1] = 0xaa;

const pubKey2 = new Uint8Array(33).fill(0x03);
pubKey2[0] = 0x03; // Compressed key prefix
pubKey2[1] = 0xbb;

const pubKey3 = new Uint8Array(33).fill(0x02);
pubKey3[0] = 0x02;
pubKey3[1] = 0xcc;

const addr1 = hash160(pubKey1);
const addr2 = hash160(pubKey2);
const addr3 = hash160(pubKey3);
