import * as Ed25519 from "../../../src/crypto/Ed25519/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

/**
 * Ed25519 for SSH Keys (RFC 8709)
 *
 * Demonstrates Ed25519 in SSH context:
 * - SSH key generation (ssh-ed25519)
 * - SSH public key format
 * - SSH signature format
 * - Advantages over RSA and ECDSA for SSH
 */

console.log("=== Ed25519 for SSH Keys (RFC 8709) ===\n");

// 1. Generate SSH keypair
console.log("1. SSH Keypair Generation");
console.log("-".repeat(40));

// Generate seed (equivalent to ssh-keygen -t ed25519)
const seed = new Uint8Array(32);
crypto.getRandomValues(seed);

const keypair = Ed25519.keypairFromSeed(seed);

console.log("Generated ssh-ed25519 keypair:");
console.log(`Secret key: ${Hex.fromBytes(keypair.secretKey)}`);
console.log(`Public key: ${Hex.fromBytes(keypair.publicKey)}`);

console.log("\nEquivalent to: ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519\n");

// 2. SSH public key format
console.log("2. SSH Public Key Format");
console.log("-".repeat(40));

console.log("SSH public key structure (base64-encoded):");
console.log("ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... user@host");

console.log("\nDecoded structure:");
console.log('- Algorithm name: "ssh-ed25519" (11 bytes)');
console.log("- Public key: 32 bytes");
console.log("- Total: 43+ bytes (base64-encoded)");

// Simplified encoding
const algorithmName = new TextEncoder().encode("ssh-ed25519");
console.log(`\nAlgorithm: "${new TextDecoder().decode(algorithmName)}"`);
console.log(`Public key (hex): ${Hex.fromBytes(keypair.publicKey)}`);
console.log(`Public key (bytes): 32\n`);

// 3. SSH signature process
console.log("3. SSH Signature Process");
console.log("-".repeat(40));

// SSH signs the session data
const sessionId = new Uint8Array(32);
crypto.getRandomValues(sessionId);

const message = new TextEncoder().encode("SSH authentication message");

// SSH signature data includes:
// - session identifier
// - message type
// - username
// - service name
// - algorithm name
// - public key
// - signature

console.log("SSH signature input includes:");
console.log(`- Session ID: ${Hex.fromBytes(sessionId).slice(0, 40)}...`);
console.log(`- Message: "${new TextDecoder().decode(message)}"`);

// Combine data (simplified)
const signData = new Uint8Array([...sessionId, ...message]);

const signature = Ed25519.sign(signData, keypair.secretKey);

console.log(
	`\nSignature (64 bytes): ${Hex.fromBytes(signature).slice(0, 40)}...\n`,
);

// 4. SSH signature verification
console.log("4. SSH Signature Verification");
console.log("-".repeat(40));

const isValid = Ed25519.verify(signature, signData, keypair.publicKey);

console.log(`Server verifies signature: ${isValid}`);
console.log("Authentication successful!\n");

// 5. Why Ed25519 for SSH
console.log("5. Why Ed25519 for SSH?");
console.log("-".repeat(40));

console.log("Advantages over RSA (ssh-rsa):");
console.log("✓ Smaller keys: 32 bytes vs 2048+ bits (256+ bytes)");
console.log("✓ Faster: 10-100x faster signing and verification");
console.log("✓ More secure: 128-bit security vs ~100-bit for RSA-2048");
console.log("✓ Simpler: No key size choice, one secure option");

console.log("\nAdvantages over ECDSA (ecdsa-sha2-nistp256):");
console.log("✓ Deterministic: No nonce generation (safer)");
console.log("✓ Faster: ~2x signing, ~2x verification");
console.log("✓ No malleability: Signatures cannot be modified");
console.log("✓ Simpler: Fewer edge cases and special handling\n");

// 6. SSH key fingerprint
console.log("6. SSH Key Fingerprint");
console.log("-".repeat(40));

// SSH fingerprints are SHA-256 hash of public key
const encoder = new TextEncoder();

// Simplified fingerprint (SHA-256 of public key)
// Real SSH includes length-prefixed encoding
const fingerprintData = new Uint8Array([
	...encoder.encode("ssh-ed25519"),
	...keypair.publicKey,
]);

console.log("SSH fingerprint calculation:");
console.log("SHA256(algorithm || public_key)");
console.log("\nDisplayed as:");
console.log("SHA256:BASE64_HASH (modern)");
console.log("or MD5:HEX_HASH (legacy)\n");

// 7. GitHub/GitLab SSH keys
console.log("7. GitHub/GitLab SSH Authentication");
console.log("-".repeat(40));

console.log("Adding Ed25519 key to GitHub:");
console.log('1. Generate: ssh-keygen -t ed25519 -C "email@example.com"');
console.log("2. Copy public key: cat ~/.ssh/id_ed25519.pub");
console.log("3. Add to GitHub Settings → SSH and GPG keys");
console.log("4. Test: ssh -T git@github.com");

console.log("\nPublic key format:");
console.log(
	`ssh-ed25519 ${Hex.fromBytes(keypair.publicKey).slice(0, 40)}... user@host`,
);

console.log("\nWhy GitHub recommends Ed25519:");
console.log("• Stronger security than RSA-2048");
console.log("• Smaller key size (easier to manage)");
console.log("• Faster authentication");
console.log("• Modern standard (RFC 8709)\n");

// 8. SSH agent forwarding
console.log("8. SSH Agent Forwarding");
console.log("-".repeat(40));

console.log("SSH agent holds Ed25519 private keys:");
console.log("$ ssh-add ~/.ssh/id_ed25519");
console.log("$ ssh-add -l  # List keys");

console.log("\nAgent forwarding workflow:");
console.log("1. Client requests signature from agent");
console.log("2. Agent signs challenge with Ed25519 key");
console.log("3. Signature sent to server");
console.log("4. Server verifies with stored public key");

console.log("\nPrivate key never leaves the agent!\n");

// 9. Multi-signature SSH (multiple keys)
console.log("9. Multiple SSH Keys");
console.log("-".repeat(40));

// Generate additional keypairs
const keypair2 = Ed25519.keypairFromSeed(
	crypto.getRandomValues(new Uint8Array(32)),
);
const keypair3 = Ed25519.keypairFromSeed(
	crypto.getRandomValues(new Uint8Array(32)),
);

console.log("User can have multiple Ed25519 keys:");
console.log(
	`\nKey 1 (GitHub):  ${Hex.fromBytes(keypair.publicKey).slice(0, 40)}...`,
);
console.log(
	`Key 2 (Work):    ${Hex.fromBytes(keypair2.publicKey).slice(0, 40)}...`,
);
console.log(
	`Key 3 (Servers): ${Hex.fromBytes(keypair3.publicKey).slice(0, 40)}...`,
);

console.log("\nSSH tries each key until one succeeds:");
console.log("~/.ssh/config:");
console.log("  Host github.com");
console.log("    IdentityFile ~/.ssh/id_ed25519_github");
console.log("  Host work.example.com");
console.log("    IdentityFile ~/.ssh/id_ed25519_work\n");

// 10. Signing Git commits
console.log("10. Git Commit Signing with Ed25519");
console.log("-".repeat(40));

console.log("Configure Git to sign commits:");
console.log("$ git config --global user.signingkey ~/.ssh/id_ed25519.pub");
console.log("$ git config --global gpg.format ssh");
console.log("$ git config --global commit.gpgsign true");

const commitMessage = new TextEncoder().encode(
	"commit 1234567890abcdef\n" +
		"tree abcdef1234567890\n" +
		"parent 0987654321fedcba\n" +
		"author User <user@example.com> 1234567890 +0000\n" +
		"committer User <user@example.com> 1234567890 +0000\n" +
		"\n" +
		"feat: add new feature",
);

const commitSig = Ed25519.sign(commitMessage, keypair.secretKey);

console.log("\nGit commit signature:");
console.log(
	`Commit: ${new TextDecoder().decode(commitMessage.slice(0, 50))}...`,
);
console.log(`Signature: ${Hex.fromBytes(commitSig).slice(0, 40)}...`);

const verifyCommit = Ed25519.verify(
	commitSig,
	commitMessage,
	keypair.publicKey,
);
console.log(`Verified: ${verifyCommit}`);

console.log("\nBenefits:");
console.log("• Prove commit authorship");
console.log("• Prevent commit tampering");
console.log('• GitHub shows "Verified" badge');
console.log("• Faster than GPG signatures\n");

// 11. Performance comparison
console.log("11. SSH Performance Comparison");
console.log("-".repeat(40));

console.log("Connection time (approximate):");
console.log("RSA-2048:  ~100ms (key exchange + auth)");
console.log("RSA-4096:  ~300ms (very slow)");
console.log("ECDSA-256: ~50ms");
console.log("Ed25519:   ~30ms (fastest)");

console.log("\nKey generation time:");
console.log("RSA-2048:  ~500ms");
console.log("RSA-4096:  ~5000ms (10x slower)");
console.log("ECDSA-256: ~50ms");
console.log("Ed25519:   ~1ms (500x faster than RSA-2048)");

console.log("\nEd25519 is the clear winner for SSH!\n");

console.log("=== Complete ===");
