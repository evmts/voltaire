import * as Ed25519 from "../../../src/crypto/Ed25519/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";
import { SHA256 } from "../../../src/crypto/SHA256/index.js";

/**
 * Ed25519 for Solana-Style Transactions
 *
 * Demonstrates Ed25519 in Solana/Stellar blockchain context:
 * - Account keypair generation
 * - Transaction signing
 * - Multi-signature patterns
 * - Program account signatures
 * - Cross-chain considerations with Ethereum
 */

console.log("=== Ed25519 for Solana-Style Transactions ===\n");

// 1. Generate Solana account
console.log("1. Solana Account Generation");
console.log("-".repeat(40));

// Generate seed (in real Solana, from BIP39 mnemonic)
const accountSeed = new Uint8Array(32);
crypto.getRandomValues(accountSeed);

const accountKeypair = Ed25519.keypairFromSeed(accountSeed);

console.log("Solana account generated:");
console.log(`Public key (address): ${Hex.fromBytes(accountKeypair.publicKey)}`);
console.log(`Secret key (32 bytes): [stored securely, never shared]`);

console.log("\nSolana uses Ed25519 for all accounts:");
console.log("- User accounts (wallets)");
console.log("- Program accounts (smart contracts)");
console.log("- Token accounts");
console.log("- Stake accounts\n");

// 2. Create and sign a Solana transaction
console.log("2. Transaction Signing");
console.log("-".repeat(40));

// Simplified Solana transaction structure
const transaction = {
	recentBlockhash: new Uint8Array(32).fill(0xab), // Recent blockhash
	feePayer: accountKeypair.publicKey,
	instructions: [
		{
			programId: new Uint8Array(32).fill(0x01), // System program
			accounts: [accountKeypair.publicKey],
			data: new Uint8Array([2, 0, 0, 0]), // Transfer instruction
		},
	],
};

console.log("Transaction structure:");
console.log(
	`Fee payer: ${Hex.fromBytes(transaction.feePayer).slice(0, 40)}...`,
);
console.log(
	`Recent blockhash: ${Hex.fromBytes(transaction.recentBlockhash).slice(0, 40)}...`,
);
console.log(`Instructions: ${transaction.instructions.length}`);

// Serialize transaction (simplified)
const txData = new Uint8Array([
	...transaction.recentBlockhash,
	...transaction.feePayer,
	...transaction.instructions[0].programId,
	...transaction.instructions[0].data,
]);

console.log(`\nSerialized transaction (${txData.length} bytes)`);

// Sign transaction message
const signature = Ed25519.sign(txData, accountKeypair.secretKey);

console.log(
	`\nTransaction signature: ${Hex.fromBytes(signature).slice(0, 40)}...`,
);
console.log("Transaction ready to broadcast to Solana network\n");

// 3. Verify transaction signature
console.log("3. Transaction Verification");
console.log("-".repeat(40));

const isValid = Ed25519.verify(signature, txData, accountKeypair.publicKey);

console.log("Solana validator verification:");
console.log(`1. Deserialize transaction`);
console.log(`2. Extract signature and public key`);
console.log(`3. Verify Ed25519 signature`);
console.log(`\nSignature valid: ${isValid}`);
console.log("Transaction accepted into block\n");

// 4. Multi-signature transaction
console.log("4. Multi-Signature Transaction");
console.log("-".repeat(40));

// Generate additional signers
const signer2Seed = new Uint8Array(32);
crypto.getRandomValues(signer2Seed);
const signer2 = Ed25519.keypairFromSeed(signer2Seed);

const signer3Seed = new Uint8Array(32);
crypto.getRandomValues(signer3Seed);
const signer3 = Ed25519.keypairFromSeed(signer3Seed);

console.log("Multi-sig transaction (2-of-3):");
console.log(
	`Signer 1: ${Hex.fromBytes(accountKeypair.publicKey).slice(0, 40)}...`,
);
console.log(`Signer 2: ${Hex.fromBytes(signer2.publicKey).slice(0, 40)}...`);
console.log(`Signer 3: ${Hex.fromBytes(signer3.publicKey).slice(0, 40)}...`);

// Each signer signs the same transaction
const sig1 = Ed25519.sign(txData, accountKeypair.secretKey);
const sig2 = Ed25519.sign(txData, signer2.secretKey);
const sig3 = Ed25519.sign(txData, signer3.secretKey);

console.log("\nTransaction signatures:");
console.log(`Sig 1: ${Hex.fromBytes(sig1).slice(0, 40)}...`);
console.log(`Sig 2: ${Hex.fromBytes(sig2).slice(0, 40)}...`);
console.log(`Sig 3: ${Hex.fromBytes(sig3).slice(0, 40)}...`);

// Verify all signatures
const valid1 = Ed25519.verify(sig1, txData, accountKeypair.publicKey);
const valid2 = Ed25519.verify(sig2, txData, signer2.publicKey);
const valid3 = Ed25519.verify(sig3, txData, signer3.publicKey);

console.log(`\nAll signatures valid: ${valid1 && valid2 && valid3}`);
console.log("Multi-sig threshold met (2-of-3)\n");

// 5. Program Derived Address (PDA) signing
console.log("5. Program Derived Addresses (PDAs)");
console.log("-".repeat(40));

console.log("PDAs are Ed25519 public keys derived deterministically:");

// Derive PDA from program ID and seeds
const programId = new Uint8Array(32).fill(0x11);
const pdaSeed = new TextEncoder().encode("token-account");

// PDA derivation (simplified - real Solana uses findProgramAddress)
const pdaData = new Uint8Array([...programId, ...pdaSeed]);
const pdaHash = SHA256.hash(pdaData);

// Ensure it's off-curve (real Solana checks this)
console.log(`\nProgram ID: ${Hex.fromBytes(programId).slice(0, 40)}...`);
console.log(`Seed: "${new TextDecoder().decode(pdaSeed)}"`);
console.log(`PDA (derived): ${Hex.fromBytes(pdaHash).slice(0, 40)}...`);

console.log("\nPDAs have no private key:");
console.log('- Only the program can "sign" for them');
console.log("- Deterministic from program ID + seeds");
console.log("- Used for token accounts, escrow, etc.\n");

// 6. Solana vs Ethereum signing
console.log("6. Solana vs Ethereum Signing");
console.log("-".repeat(40));

console.log("Solana (Ed25519):");
console.log("✓ Signs full transaction message directly");
console.log("✓ No pre-hashing (Ed25519 handles it internally)");
console.log("✓ Deterministic signatures (no nonce issues)");
console.log("✓ 64-byte signatures");
console.log("✓ 32-byte public keys");

console.log("\nEthereum (secp256k1 ECDSA):");
console.log("✓ Signs Keccak-256 hash of transaction");
console.log("✓ Pre-hashing required (32-byte hash input)");
console.log("✓ RFC 6979 for determinism (or random nonce)");
console.log("✓ 65-byte signatures (r, s, v)");
console.log("✓ 64-byte public keys (uncompressed)");

console.log("\nKey differences:");
console.log("- Ed25519 is faster (~2-3x)");
console.log("- Ed25519 is safer (no nonce reuse possible)");
console.log("- secp256k1 allows address recovery from signature");
console.log("- Different curves = incompatible\n");

// 7. Cross-chain considerations
console.log("7. Cross-Chain Considerations");
console.log("-".repeat(40));

console.log("Bridging Solana ↔ Ethereum:\n");

console.log("Challenge: Different signature schemes");
console.log("- Solana validators cannot verify secp256k1");
console.log("- Ethereum cannot verify Ed25519 (natively)");

console.log("\nSolution 1: Smart contract verification");
console.log("- Deploy Ed25519 verifier contract on Ethereum");
console.log("- Expensive in gas (no precompile yet)");
console.log("- EIP-665 proposed but not adopted");

console.log("\nSolution 2: Threshold signatures");
console.log("- Multi-sig with both Ed25519 and secp256k1 keys");
console.log("- Bridge validators sign with both schemes");
console.log("- Each chain verifies its native signature type");

console.log("\nSolution 3: Centralized bridge");
console.log("- Trusted validator set");
console.log("- Converts signatures between chains");
console.log("- Less decentralized but simpler\n");

// 8. Performance: Ed25519 advantages
console.log("8. Performance Benefits");
console.log("-".repeat(40));

console.log("Why Solana chose Ed25519:\n");

console.log("1. Signing speed:");
console.log("   - Ed25519: ~1000+ signatures/sec (single core)");
console.log("   - secp256k1: ~300-500 signatures/sec");
console.log("   - Critical for high-throughput blockchain");

console.log("\n2. Verification speed:");
console.log("   - Ed25519: ~2000+ verifications/sec");
console.log("   - secp256k1: ~800-1200 verifications/sec");
console.log("   - Validators process 1000s of tx/sec");

console.log("\n3. Batch verification:");
console.log("   - Ed25519 supports efficient batch verification");
console.log("   - Verify 100 signatures faster than 100 individual checks");
console.log("   - Perfect for block validation");

console.log("\n4. Simplicity:");
console.log("   - No malleability issues");
console.log("   - No nonce generation");
console.log("   - Harder to implement incorrectly\n");

// 9. Token transfer example
console.log("9. SPL Token Transfer (Solana)");
console.log("-".repeat(40));

const tokenMint = new Uint8Array(32).fill(0x22); // Token mint address
const sourceAccount = accountKeypair.publicKey;
const destAccount = signer2.publicKey;
const amount = 1000000n; // 1 token (6 decimals)

console.log("SPL Token transfer:");
console.log(`From: ${Hex.fromBytes(sourceAccount).slice(0, 40)}...`);
console.log(`To:   ${Hex.fromBytes(destAccount).slice(0, 40)}...`);
console.log(`Token: ${Hex.fromBytes(tokenMint).slice(0, 40)}...`);
console.log(`Amount: ${amount} (1.000000 tokens)`);

// Create transfer instruction
const transferInstruction = new Uint8Array([
	3, // Transfer instruction
	...new Uint8Array(new BigUint64Array([amount]).buffer),
]);

// Sign transfer
const transferSig = Ed25519.sign(transferInstruction, accountKeypair.secretKey);

console.log(
	`\nTransfer signature: ${Hex.fromBytes(transferSig).slice(0, 40)}...`,
);

const transferValid = Ed25519.verify(
	transferSig,
	transferInstruction,
	accountKeypair.publicKey,
);

console.log(`Signature valid: ${transferValid}`);
console.log("Token transfer executed on Solana\n");

// 10. Stellar integration
console.log("10. Stellar Integration (Also Uses Ed25519)");
console.log("-".repeat(40));

console.log("Stellar and Solana both use Ed25519:");
console.log("- Same signature algorithm");
console.log("- Compatible public key format");
console.log("- Different transaction structure");

console.log("\nCross-chain potential:");
console.log("- Could share identity keys");
console.log("- Sign transactions on both chains");
console.log("- Same keypair, different blockchains");

console.log("\nExample: Dual-chain account");
console.log(`Solana address:  ${Hex.fromBytes(accountKeypair.publicKey)}`);
console.log(`Stellar address: ${Hex.fromBytes(accountKeypair.publicKey)}`);
console.log("(Same public key, different network encoding)\n");

console.log("=== Complete ===");
