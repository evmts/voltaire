import * as Ed25519 from "../../../src/crypto/Ed25519/index.js";
import { SHA256 } from "../../../src/crypto/SHA256/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

// Generate seed (in real Solana, from BIP39 mnemonic)
const accountSeed = new Uint8Array(32);
crypto.getRandomValues(accountSeed);

const accountKeypair = Ed25519.keypairFromSeed(accountSeed);

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

// Serialize transaction (simplified)
const txData = new Uint8Array([
	...transaction.recentBlockhash,
	...transaction.feePayer,
	...transaction.instructions[0].programId,
	...transaction.instructions[0].data,
]);

// Sign transaction message
const signature = Ed25519.sign(txData, accountKeypair.secretKey);

const isValid = Ed25519.verify(signature, txData, accountKeypair.publicKey);

// Generate additional signers
const signer2Seed = new Uint8Array(32);
crypto.getRandomValues(signer2Seed);
const signer2 = Ed25519.keypairFromSeed(signer2Seed);

const signer3Seed = new Uint8Array(32);
crypto.getRandomValues(signer3Seed);
const signer3 = Ed25519.keypairFromSeed(signer3Seed);

// Each signer signs the same transaction
const sig1 = Ed25519.sign(txData, accountKeypair.secretKey);
const sig2 = Ed25519.sign(txData, signer2.secretKey);
const sig3 = Ed25519.sign(txData, signer3.secretKey);

// Verify all signatures
const valid1 = Ed25519.verify(sig1, txData, accountKeypair.publicKey);
const valid2 = Ed25519.verify(sig2, txData, signer2.publicKey);
const valid3 = Ed25519.verify(sig3, txData, signer3.publicKey);

// Derive PDA from program ID and seeds
const programId = new Uint8Array(32).fill(0x11);
const pdaSeed = new TextEncoder().encode("token-account");

// PDA derivation (simplified - real Solana uses findProgramAddress)
const pdaData = new Uint8Array([...programId, ...pdaSeed]);
const pdaHash = SHA256.hash(pdaData);

const tokenMint = new Uint8Array(32).fill(0x22); // Token mint address
const sourceAccount = accountKeypair.publicKey;
const destAccount = signer2.publicKey;
const amount = 1000000n; // 1 token (6 decimals)

// Create transfer instruction
const transferInstruction = new Uint8Array([
	3, // Transfer instruction
	...new Uint8Array(new BigUint64Array([amount]).buffer),
]);

// Sign transfer
const transferSig = Ed25519.sign(transferInstruction, accountKeypair.secretKey);

const transferValid = Ed25519.verify(
	transferSig,
	transferInstruction,
	accountKeypair.publicKey,
);
