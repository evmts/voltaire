/**
 * Wallet Encryption with AES-GCM
 *
 * Demonstrates:
 * - Encrypting Ethereum private keys
 * - Wallet file format (similar to keystore files)
 * - Secure key storage and retrieval
 * - Password-protected wallet operations
 */

import * as AesGcm from "../../../src/crypto/AesGcm/index.js";
import * as Secp256k1 from "../../../src/crypto/Secp256k1/index.js";
import * as Address from "../../../src/primitives/Address/index.js";

// Wallet encryption format
interface EncryptedWallet {
	version: number;
	address: string;
	crypto: {
		cipher: "aes-256-gcm";
		ciphertext: string;
		salt: string;
		nonce: string;
		iterations: number;
	};
	timestamp: number;
}

// Encrypt private key with password
async function encryptWallet(
	privateKey: Uint8Array,
	password: string,
): Promise<EncryptedWallet> {
	// Derive Ethereum address from private key
	const publicKey = Secp256k1.derivePublicKey(privateKey);
	const address = Address.fromPublicKey(publicKey);

	// Generate salt for PBKDF2
	const salt = crypto.getRandomValues(new Uint8Array(32)); // 32 bytes for extra security

	// Derive encryption key (600,000 iterations for wallet security)
	const iterations = 600000;
	const key = await AesGcm.deriveKey(password, salt, iterations, 256);

	// Generate nonce
	const nonce = AesGcm.generateNonce();

	// Encrypt private key
	const ciphertext = await AesGcm.encrypt(privateKey, key, nonce);

	// Create wallet object
	return {
		version: 1,
		address: Address.toHex(address),
		crypto: {
			cipher: "aes-256-gcm",
			ciphertext: Buffer.from(ciphertext).toString("hex"),
			salt: Buffer.from(salt).toString("hex"),
			nonce: Buffer.from(nonce).toString("hex"),
			iterations,
		},
		timestamp: Date.now(),
	};
}

// Decrypt wallet with password
async function decryptWallet(
	wallet: EncryptedWallet,
	password: string,
): Promise<Uint8Array> {
	const { crypto: cryptoParams } = wallet;

	// Parse hex strings
	const salt = Buffer.from(cryptoParams.salt, "hex");
	const nonce = Buffer.from(cryptoParams.nonce, "hex");
	const ciphertext = Buffer.from(cryptoParams.ciphertext, "hex");

	// Derive key
	const key = await AesGcm.deriveKey(
		password,
		salt,
		cryptoParams.iterations,
		256,
	);

	// Decrypt private key
	return await AesGcm.decrypt(ciphertext, key, nonce);
}

// Verify wallet password without decrypting
async function verifyWalletPassword(
	wallet: EncryptedWallet,
	password: string,
): Promise<boolean> {
	try {
		const privateKey = await decryptWallet(wallet, password);

		// Verify address matches
		const publicKey = Secp256k1.derivePublicKey(privateKey);
		const address = Address.fromPublicKey(publicKey);
		const addressHex = Address.toHex(address);

		return addressHex.toLowerCase() === wallet.address.toLowerCase();
	} catch {
		return false;
	}
}

// Generate new private key
const privateKey = new Uint8Array(32);
crypto.getRandomValues(privateKey);

// Derive address
const publicKey = Secp256k1.derivePublicKey(privateKey);
const address = Address.fromPublicKey(publicKey);

const password = "secure-wallet-password-2024";

// Encrypt wallet
const encryptedWallet = await encryptWallet(privateKey, password);

const decryptedKey = await decryptWallet(encryptedWallet, password);

// Verify address
const decryptedPublicKey = Secp256k1.derivePublicKey(decryptedKey);
const decryptedAddress = Address.fromPublicKey(decryptedPublicKey);

const correctPassword = password;
const wrongPassword = "wrong-password";

const isCorrect = await verifyWalletPassword(encryptedWallet, correctPassword);

const isWrong = await verifyWalletPassword(encryptedWallet, wrongPassword);

const wallets: EncryptedWallet[] = [];
const walletPasswords = ["pass1", "pass2", "pass3"];

for (let i = 0; i < 3; i++) {
	const key = new Uint8Array(32);
	crypto.getRandomValues(key);

	const wallet = await encryptWallet(key, walletPasswords[i]);
	wallets.push(wallet);
}

const walletJson = JSON.stringify(encryptedWallet, null, 2);
const walletBytes = new TextEncoder().encode(walletJson);

const oldPassword = password;
const newPassword = "new-secure-password-2024";

// Decrypt with old password
const originalKey = await decryptWallet(encryptedWallet, oldPassword);

// Re-encrypt with new password
const reencryptedWallet = await encryptWallet(originalKey, newPassword);

// Verify old password no longer works
const oldWorks = await verifyWalletPassword(reencryptedWallet, oldPassword);

// Verify new password works
const newWorks = await verifyWalletPassword(reencryptedWallet, newPassword);

const message = "Sign this message";
const messageBytes = new TextEncoder().encode(message);

// Decrypt wallet
const signingKey = await decryptWallet(encryptedWallet, password);

// Sign message
const signature = Secp256k1.sign(messageBytes, signingKey);

// Verify signature
const signingPublicKey = Secp256k1.derivePublicKey(signingKey);
const isValid = Secp256k1.verify(signature, messageBytes, signingPublicKey);
