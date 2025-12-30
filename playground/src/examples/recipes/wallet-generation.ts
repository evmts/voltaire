import {
	Address,
	Bip39,
	Bytes,
	Hex,
	Secp256k1,
} from "@tevm/voltaire";
import * as HDWallet from "@tevm/voltaire";

// === Complete Wallet Generation Recipe ===
// This recipe demonstrates how to create a new Ethereum wallet from scratch

console.log("=== Wallet Generation Recipe ===\n");

// === Option 1: Generate from new mnemonic (most secure for new wallets) ===
console.log("Option 1: Generate from new mnemonic");
console.log("-".repeat(40));

// Generate a new 24-word mnemonic (256 bits entropy)
const mnemonic = Bip39.generateMnemonic(256);
console.log("Mnemonic (24 words):");
console.log(`  ${mnemonic}`);
console.log("\n⚠️  IMPORTANT: Write down this mnemonic and store it securely!");
console.log("  Never share it with anyone. This is your master backup.\n");

// Convert mnemonic to seed
const seed = await Bip39.mnemonicToSeed(mnemonic);

// Create HD wallet root
const root = HDWallet.HDWallet.fromSeed(seed);

// Derive first Ethereum address using BIP-44 path: m/44'/60'/0'/0/0
const firstAccount = HDWallet.HDWallet.deriveEthereum(root, 0, 0);
const privateKey = HDWallet.HDWallet.getPrivateKey(firstAccount);
if (!privateKey) throw new Error("Failed to derive private key");

const publicKey = Secp256k1.derivePublicKey(privateKey);
const address = Address.fromPublicKey(publicKey);

console.log("First derived address:");
console.log(`  Address: ${Address.toChecksummed(address)}`);
console.log(`  Private key: ${Hex.fromBytes(privateKey)}`);
console.log(`  Path: m/44'/60'/0'/0/0\n`);

// Derive multiple addresses from same mnemonic
console.log("Additional addresses from same mnemonic:");
for (let i = 1; i <= 3; i++) {
	const account = HDWallet.HDWallet.deriveEthereum(root, 0, i);
	const pk = HDWallet.HDWallet.getPrivateKey(account);
	if (!pk) continue;
	const pub = Secp256k1.derivePublicKey(pk);
	const addr = Address.fromPublicKey(pub);
	console.log(`  [${i}] ${Address.toChecksummed(addr)} (m/44'/60'/0'/0/${i})`);
}

// === Option 2: Generate random private key directly (simpler, no backup) ===
console.log("\n\nOption 2: Generate random private key directly");
console.log("-".repeat(40));

const randomPrivateKey = Secp256k1.randomPrivateKey();
const randomPublicKey = Secp256k1.derivePublicKey(randomPrivateKey);
const randomAddress = Address.fromPublicKey(randomPublicKey);

console.log("Random wallet:");
console.log(`  Address: ${Address.toChecksummed(randomAddress)}`);
console.log(`  Private key: ${Hex.fromBytes(randomPrivateKey)}`);
console.log("\n⚠️  No mnemonic backup! Store the private key securely.\n");

// === Option 3: Import existing mnemonic ===
console.log("Option 3: Import existing mnemonic");
console.log("-".repeat(40));

// Standard test mnemonic (DO NOT use in production!)
const testMnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

// Validate the mnemonic first
const isValid = Bip39.validateMnemonic(testMnemonic);
console.log(`Test mnemonic valid: ${isValid}`);

if (isValid) {
	const testSeed = await Bip39.mnemonicToSeed(testMnemonic);
	const testRoot = HDWallet.HDWallet.fromSeed(testSeed);
	const testAccount = HDWallet.HDWallet.deriveEthereum(testRoot, 0, 0);
	const testPk = HDWallet.HDWallet.getPrivateKey(testAccount);
	if (testPk) {
		const testPub = Secp256k1.derivePublicKey(testPk);
		const testAddr = Address.fromPublicKey(testPub);
		console.log(`First address: ${Address.toChecksummed(testAddr)}`);
		// Known result: 0x9858EfFD232B4033E47d90003D41EC34EcaEda94
	}
}

// === Wallet validation ===
console.log("\n\n=== Wallet Validation ===");
console.log("-".repeat(40));

// Verify private key is valid
const pkValid = Secp256k1.isValidPrivateKey(privateKey);
console.log(`Private key valid: ${pkValid}`);

// Sign a test message to verify the keypair works
const testMessage = new TextEncoder().encode("test");
const messageHash = new Uint8Array(32);
// Simple hash for testing
for (let i = 0; i < testMessage.length && i < 32; i++) {
	messageHash[i] = testMessage[i];
}

const signature = Secp256k1.sign(messageHash, privateKey);
const verified = Secp256k1.verify(signature, messageHash, publicKey);
console.log(`Signature verification: ${verified}`);

// Recover public key from signature
const recoveredPubKey = Secp256k1.recoverPublicKey(signature, messageHash);
const recoveredAddr = Address.fromPublicKey(recoveredPubKey);
const addressMatch =
	Address.toChecksummed(address) === Address.toChecksummed(recoveredAddr);
console.log(`Address recovery match: ${addressMatch}`);

console.log("\n=== Recipe Complete ===");
