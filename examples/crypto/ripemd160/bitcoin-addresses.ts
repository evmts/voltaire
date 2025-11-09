import { Ripemd160 } from "../../../src/crypto/Ripemd160/index.js";
import { SHA256 } from "../../../src/crypto/SHA256/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

/**
 * Bitcoin Address Derivation with RIPEMD160
 *
 * Demonstrates Bitcoin's use of RIPEMD160:
 * - P2PKH address generation (Pay-to-PubKey-Hash)
 * - P2SH address generation (Pay-to-Script-Hash)
 * - SHA256 + RIPEMD160 double hashing
 * - Why Bitcoin uses both algorithms together
 */

console.log("=== Bitcoin Address Derivation with RIPEMD160 ===\n");

// 1. P2PKH Address Generation (Legacy Bitcoin Addresses)
console.log("1. P2PKH Address Generation");
console.log("-".repeat(40));

// Simulate a Bitcoin public key (33 bytes compressed or 65 bytes uncompressed)
const publicKey = new Uint8Array(65);
publicKey[0] = 0x04; // Uncompressed public key prefix
// Fill with example data (in reality, this comes from ECDSA secp256k1)
for (let i = 1; i < 65; i++) {
	publicKey[i] = i % 256;
}

console.log("Step 1: Start with public key");
console.log(
	`Public key (65 bytes): ${Hex.fromBytes(publicKey.slice(0, 20))}...`,
);

// Step 2: SHA-256 hash of public key
const sha256Hash = SHA256.hash(publicKey);
console.log("\nStep 2: SHA-256 hash of public key");
console.log(`SHA-256: ${Hex.fromBytes(sha256Hash)}`);

// Step 3: RIPEMD160 hash of SHA-256 result
const pubKeyHash = Ripemd160.hash(sha256Hash);
console.log("\nStep 3: RIPEMD160 hash of SHA-256 result");
console.log(`RIPEMD160: ${Hex.fromBytes(pubKeyHash)}`);
console.log(`Length: ${pubKeyHash.length} bytes (Bitcoin address size)\n`);

console.log('This 20-byte hash is the "pubkey hash" used in Bitcoin addresses');
console.log(
	"(Would be Base58Check encoded with version byte 0x00 for mainnet)\n",
);

// 2. P2SH Address Generation (Script Hash)
console.log("2. P2SH Address Generation");
console.log("-".repeat(40));

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

console.log("Redeem script (2-of-3 multisig):");
console.log(`Script bytes: ${redeemScript.length}`);

// Step 1: SHA-256 of redeem script
const scriptSha256 = SHA256.hash(redeemScript);
console.log(`\nSHA-256 of script: ${Hex.fromBytes(scriptSha256)}`);

// Step 2: RIPEMD160 of SHA-256 result
const scriptHash = Ripemd160.hash(scriptSha256);
console.log(`RIPEMD160 of SHA-256: ${Hex.fromBytes(scriptHash)}`);
console.log(`\nThis 20-byte hash is the P2SH address`);
console.log(
	"(Would be Base58Check encoded with version byte 0x05 for mainnet)\n",
);

// 3. Why Bitcoin Uses SHA-256 + RIPEMD160
console.log("3. Why Bitcoin Uses Both SHA-256 and RIPEMD160");
console.log("-".repeat(40));

console.log("Reasons for double hashing:");
console.log("\n1. Redundancy:");
console.log("   - If one algorithm is broken, the other provides backup");
console.log("   - Would need to break BOTH to create address collision");
console.log("   - Defense-in-depth security strategy");

console.log("\n2. Compact Addresses:");
console.log("   - RIPEMD160 produces 20 bytes vs SHA-256's 32 bytes");
console.log("   - Reduces address size by 37.5%");
console.log("   - Smaller QR codes, less blockchain storage");

console.log("\n3. Historical Context (2009):");
console.log("   - SHA-256 was NIST standard (trusted)");
console.log("   - RIPEMD160 was independent alternative (diversity)");
console.log("   - Satoshi chose conservative approach");

console.log("\n4. Security Trade-offs:");
console.log("   - 20 bytes = 160 bits = ~80-bit collision security");
console.log("   - Good enough for addresses (2^80 is huge)");
console.log("   - Double hash increases preimage resistance\n");

// 4. Address Collision Probability
console.log("4. Address Collision Probability");
console.log("-".repeat(40));

const addressSpace = 2n ** 160n; // Total possible addresses
console.log(
	`Total address space: 2^160 ≈ ${addressSpace.toString().slice(0, 10)}...`,
);
console.log("(That's about 1.46 × 10^48 addresses)");

console.log("\nBirthday attack collision after ~2^80 hashes:");
console.log("- 2^80 ≈ 1.2 × 10^24 operations");
console.log("- Would take millions of years with all computers on Earth");
console.log("- Combined with SHA-256, effectively impossible\n");

// 5. Hash160 Function (Common Bitcoin Pattern)
console.log("5. Hash160 Function (SHA256 → RIPEMD160)");
console.log("-".repeat(40));

function hash160(data: Uint8Array): Uint8Array {
	const sha256 = SHA256.hash(data);
	return Ripemd160.hash(sha256);
}

const testData = new TextEncoder().encode("test data");
const hash160Result = hash160(testData);

console.log("hash160() = RIPEMD160(SHA256(data))");
console.log(`Input: ${Hex.fromBytes(testData)}`);
console.log(`Output: ${Hex.fromBytes(hash160Result)}`);
console.log("\nThis pattern is used everywhere in Bitcoin:");
console.log("- P2PKH addresses");
console.log("- P2SH addresses");
console.log("- Script verification\n");

// 6. Comparing Different Public Keys
console.log("6. Multiple Public Keys → Different Addresses");
console.log("-".repeat(40));

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

console.log("Three different public keys produce three different addresses:");
console.log(`\nAddress 1: ${Hex.fromBytes(addr1)}`);
console.log(`Address 2: ${Hex.fromBytes(addr2)}`);
console.log(`Address 3: ${Hex.fromBytes(addr3)}`);

console.log("\nEach address is unique and deterministic\n");

// 7. Segwit vs Legacy
console.log("7. Legacy RIPEMD160 vs Modern SegWit");
console.log("-".repeat(40));

console.log("Legacy addresses (P2PKH/P2SH):");
console.log("- Use SHA-256 + RIPEMD160");
console.log("- 20-byte hash");
console.log("- Base58Check encoding");
console.log("- Example: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");

console.log("\nSegWit addresses (P2WPKH/P2WSH):");
console.log("- Use SHA-256 only (no RIPEMD160 for witness v1+)");
console.log("- Bech32 encoding");
console.log("- Example: bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4");

console.log("\nTaproot addresses (P2TR):");
console.log("- Use Schnorr signatures (different scheme)");
console.log("- No RIPEMD160 at all");
console.log(
	"- Example: bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr",
);

console.log("\nRIPEMD160 is maintained for legacy address compatibility\n");

console.log("=== Complete ===");
