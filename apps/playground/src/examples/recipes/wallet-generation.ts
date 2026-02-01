import { Address, Bip39, Bytes, Hex, Secp256k1 } from "@tevm/voltaire";
import * as HDWallet from "@tevm/voltaire";

// Generate a new 24-word mnemonic (256 bits entropy)
const mnemonic = Bip39.generateMnemonic(256);

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
for (let i = 1; i <= 3; i++) {
	const account = HDWallet.HDWallet.deriveEthereum(root, 0, i);
	const pk = HDWallet.HDWallet.getPrivateKey(account);
	if (!pk) continue;
	const pub = Secp256k1.derivePublicKey(pk);
	const addr = Address.fromPublicKey(pub);
}

const randomPrivateKey = Secp256k1.randomPrivateKey();
const randomPublicKey = Secp256k1.derivePublicKey(randomPrivateKey);
const randomAddress = Address.fromPublicKey(randomPublicKey);

// Standard test mnemonic (DO NOT use in production!)
const testMnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

// Validate the mnemonic first
const isValid = Bip39.validateMnemonic(testMnemonic);

if (isValid) {
	const testSeed = await Bip39.mnemonicToSeed(testMnemonic);
	const testRoot = HDWallet.HDWallet.fromSeed(testSeed);
	const testAccount = HDWallet.HDWallet.deriveEthereum(testRoot, 0, 0);
	const testPk = HDWallet.HDWallet.getPrivateKey(testAccount);
	if (testPk) {
		const testPub = Secp256k1.derivePublicKey(testPk);
		const testAddr = Address.fromPublicKey(testPub);
		// Known result: 0x9858EfFD232B4033E47d90003D41EC34EcaEda94
	}
}

// Verify private key is valid
const pkValid = Secp256k1.isValidPrivateKey(privateKey);

// Sign a test message to verify the keypair works
const testMessage = new TextEncoder().encode("test");
const messageHash = new Uint8Array(32);
// Simple hash for testing
for (let i = 0; i < testMessage.length && i < 32; i++) {
	messageHash[i] = testMessage[i];
}

const signature = Secp256k1.sign(messageHash, privateKey);
const verified = Secp256k1.verify(signature, messageHash, publicKey);

// Recover public key from signature
const recoveredPubKey = Secp256k1.recoverPublicKey(signature, messageHash);
const recoveredAddr = Address.fromPublicKey(recoveredPubKey);
const addressMatch =
	Address.toChecksummed(address) === Address.toChecksummed(recoveredAddr);
