import { Address, Bytes, Hex, Keccak256, Secp256k1 } from "@tevm/voltaire";

// === Personal Message Signing Recipe (EIP-191) ===
// This recipe demonstrates how to sign and verify personal messages
// using the Ethereum personal_sign standard (EIP-191)

console.log("=== Personal Message Signing Recipe (EIP-191) ===\n");

// === Step 1: Set up signing key ===
console.log("Step 1: Generate or import a signing key");
console.log("-".repeat(50));

// Generate a random private key for this demo
const privateKey = Secp256k1.randomPrivateKey();
const publicKey = Secp256k1.derivePublicKey(privateKey);
const signerAddress = Address.fromPublicKey(publicKey);

console.log(`Signer Address: ${Address.toChecksummed(signerAddress)}`);
console.log(`Private Key: ${Hex.fromBytes(privateKey)}`);

// === Step 2: Prepare the message ===
console.log("\n\nStep 2: Prepare the message to sign");
console.log("-".repeat(50));

const message = "Hello, Ethereum! This is a personal message.";
const messageBytes = new TextEncoder().encode(message);

console.log(`Message: "${message}"`);
console.log(`Message bytes: ${Hex.fromBytes(messageBytes)}`);

// === Step 3: Create EIP-191 prefixed message ===
console.log("\n\nStep 3: Create EIP-191 prefixed message hash");
console.log("-".repeat(50));

// EIP-191 personal_sign format: "\x19Ethereum Signed Message:\n" + len(message) + message
const prefix = "\x19Ethereum Signed Message:\n";
const prefixBytes = new TextEncoder().encode(prefix);
const lengthStr = messageBytes.length.toString();
const lengthBytes = new TextEncoder().encode(lengthStr);

// Concatenate: prefix + length + message
const prefixedMessage = new Uint8Array(
	prefixBytes.length + lengthBytes.length + messageBytes.length,
);
prefixedMessage.set(prefixBytes, 0);
prefixedMessage.set(lengthBytes, prefixBytes.length);
prefixedMessage.set(messageBytes, prefixBytes.length + lengthBytes.length);

console.log(`Prefix: "${prefix}" (${prefixBytes.length} bytes)`);
console.log(`Length string: "${lengthStr}"`);
console.log(`Full prefixed message: ${Hex.fromBytes(prefixedMessage)}`);

// Hash the prefixed message with Keccak256
const messageHash = Keccak256.hash(prefixedMessage);

console.log(`Message hash (keccak256): ${Hex.fromBytes(messageHash)}`);

// === Step 4: Sign the message ===
console.log("\n\nStep 4: Sign the message hash");
console.log("-".repeat(50));

// Sign returns {r, s, v} signature
const signature = Secp256k1.sign(messageHash, privateKey);

console.log(`Signature r: ${Hex.fromBytes(signature.r)}`);
console.log(`Signature s: ${Hex.fromBytes(signature.s)}`);
console.log(`Signature v: ${signature.v}`);

// Convert to compact format (r + s + v) for transmission
const compactSignature = new Uint8Array(65);
compactSignature.set(signature.r, 0);
compactSignature.set(signature.s, 32);
compactSignature[64] = signature.v;

console.log(
	`\nCompact signature (65 bytes): ${Hex.fromBytes(compactSignature)}`,
);

// === Step 5: Verify the signature ===
console.log("\n\nStep 5: Verify the signature");
console.log("-".repeat(50));

// Method 1: Direct verification with known public key
const isValid = Secp256k1.verify(signature, messageHash, publicKey);
console.log(`Direct verification: ${isValid ? "VALID" : "INVALID"}`);

// Method 2: Recover public key from signature and compare address
const recoveredPublicKey = Secp256k1.recoverPublicKey(signature, messageHash);
const recoveredAddress = Address.fromPublicKey(recoveredPublicKey);

console.log(`\nRecovered address: ${Address.toChecksummed(recoveredAddress)}`);
console.log(`Original address:  ${Address.toChecksummed(signerAddress)}`);

const addressMatch = Address.equals(signerAddress, recoveredAddress);
console.log(`Address match: ${addressMatch ? "MATCH" : "NO MATCH"}`);

// === Step 6: Helper function for personal_sign ===
console.log("\n\n=== Reusable Helper Functions ===");
console.log("-".repeat(50));

/**
 * Creates an EIP-191 personal message hash
 * @param message - The message string to hash
 * @returns The keccak256 hash of the prefixed message
 */
function hashPersonalMessage(message: string): Uint8Array {
	const msgBytes = new TextEncoder().encode(message);
	const prefix = new TextEncoder().encode("\x19Ethereum Signed Message:\n");
	const lengthBytes = new TextEncoder().encode(msgBytes.length.toString());

	const prefixed = new Uint8Array(
		prefix.length + lengthBytes.length + msgBytes.length,
	);
	prefixed.set(prefix, 0);
	prefixed.set(lengthBytes, prefix.length);
	prefixed.set(msgBytes, prefix.length + lengthBytes.length);

	return Keccak256.hash(prefixed);
}

/**
 * Signs a personal message and returns a compact signature
 * @param message - The message to sign
 * @param privateKey - The private key (32 bytes)
 * @returns Compact signature (65 bytes: r + s + v)
 */
function signPersonalMessage(
	message: string,
	privateKey: Uint8Array,
): Uint8Array {
	const hash = hashPersonalMessage(message);
	const sig = Secp256k1.sign(hash, privateKey);

	const compact = new Uint8Array(65);
	compact.set(sig.r, 0);
	compact.set(sig.s, 32);
	compact[64] = sig.v;
	return compact;
}

/**
 * Verifies a personal message signature
 * @param message - The original message
 * @param signature - Compact signature (65 bytes)
 * @param expectedAddress - Address that should have signed
 * @returns true if signature is valid
 */
function verifyPersonalMessage(
	message: string,
	signature: Uint8Array,
	expectedAddress: Uint8Array,
): boolean {
	const hash = hashPersonalMessage(message);
	const sig = {
		r: signature.slice(0, 32),
		s: signature.slice(32, 64),
		v: signature[64],
	};

	const recoveredPubKey = Secp256k1.recoverPublicKey(sig, hash);
	const recoveredAddr = Address.fromPublicKey(recoveredPubKey);

	return Address.equals(expectedAddress, recoveredAddr);
}

// Test the helper functions
console.log("\nTesting helper functions:");
const testMessage = "Test message for helpers";
const testSig = signPersonalMessage(testMessage, privateKey);
const helperVerified = verifyPersonalMessage(
	testMessage,
	testSig,
	signerAddress,
);

console.log(`Message: "${testMessage}"`);
console.log(`Signature: ${Hex.fromBytes(testSig)}`);
console.log(`Verified: ${helperVerified}`);

// === Step 7: Common use cases ===
console.log("\n\n=== Common Use Cases ===");
console.log("-".repeat(50));

// Use case 1: Authentication message
console.log("\n1. Authentication Nonce:");
const authNonce = `Sign this message to authenticate:\nNonce: ${Date.now()}`;
const authSig = signPersonalMessage(authNonce, privateKey);
console.log(`Auth message: "${authNonce}"`);
console.log(`Auth signature: ${Hex.fromBytes(authSig)}`);

// Use case 2: Terms acceptance
console.log("\n2. Terms Acceptance:");
const termsMessage =
	"I accept the Terms of Service v1.0 for MyDApp on Ethereum Mainnet";
const termsSig = signPersonalMessage(termsMessage, privateKey);
console.log(`Terms message: "${termsMessage}"`);
console.log(`Terms signature: ${Hex.fromBytes(termsSig)}`);

// Use case 3: Off-chain voting
console.log("\n3. Off-chain Voting:");
const voteMessage = JSON.stringify({
	proposal: "QmProposalHash123",
	choice: 1,
	timestamp: Date.now(),
});
const voteSig = signPersonalMessage(voteMessage, privateKey);
console.log(`Vote payload: ${voteMessage}`);
console.log(`Vote signature: ${Hex.fromBytes(voteSig)}`);

console.log("\n=== Recipe Complete ===");
