/**
 * Wallet Generation with BIP-39
 *
 * Demonstrates:
 * - Creating new wallets from mnemonics
 * - Deriving Ethereum addresses
 * - Complete wallet backup/restore flow
 * - Multiple account generation
 * - Mnemonic phrase formatting
 */

import * as Bip39 from "../../../src/crypto/Bip39/index.js";
import * as HDWallet from "../../../src/crypto/HDWallet/index.js";
import * as Secp256k1 from "../../../src/crypto/Secp256k1/index.js";
import * as Address from "../../../src/primitives/Address/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

// Generate 24-word mnemonic (recommended for production)
const mnemonic = Bip39.generateMnemonic(256);

// Format mnemonic nicely (4 columns of 6 words)
const words = mnemonic.split(" ");
for (let i = 0; i < words.length; i += 6) {
	const row = words.slice(i, i + 6);
}

// Convert to seed
const seed = await Bip39.mnemonicToSeed(mnemonic);

// Create HD wallet root
const root = HDWallet.fromSeed(seed);

const accounts = [];
for (let i = 0; i < 5; i++) {
	// Derive key at m/44'/60'/0'/0/i
	const hdKey = HDWallet.deriveEthereum(root, 0, i);

	// Get private key
	const privateKey = HDWallet.getPrivateKey(hdKey);
	if (!privateKey) throw new Error("No private key");

	// Derive public key and address
	const publicKey = Secp256k1.derivePublicKey(privateKey);
	const address = Address.fromPublicKey(publicKey);

	accounts.push({
		index: i,
		path: `m/44'/60'/0'/0/${i}`,
		privateKey,
		address,
	});
}

const backup = {
	mnemonic,
	accounts: accounts.map((acc) => ({
		index: acc.index,
		path: acc.path,
		address: Address.toHex(acc.address),
	})),
	created: new Date().toISOString(),
};

// Simulate user restoring wallet
const restoredMnemonic = mnemonic; // In reality, user would input this

// Validate mnemonic
if (!Bip39.validateMnemonic(restoredMnemonic)) {
	throw new Error("Invalid mnemonic phrase");
}

// Derive seed
const restoredSeed = await Bip39.mnemonicToSeed(restoredMnemonic);
const restoredRoot = HDWallet.fromSeed(restoredSeed);

// Restore first account
const restoredHdKey = HDWallet.deriveEthereum(restoredRoot, 0, 0);
const restoredPrivateKey = HDWallet.getPrivateKey(restoredHdKey);
if (!restoredPrivateKey) throw new Error("No private key");

const restoredPublicKey = Secp256k1.derivePublicKey(restoredPrivateKey);
const restoredAddress = Address.fromPublicKey(restoredPublicKey);

const passphrase = "additional-security-layer";

// Same mnemonic, different passphrases = different wallets
const seedNoPass = await Bip39.mnemonicToSeed(mnemonic);
const seedWithPass = await Bip39.mnemonicToSeed(mnemonic, passphrase);

const rootNoPass = HDWallet.fromSeed(seedNoPass);
const rootWithPass = HDWallet.fromSeed(seedWithPass);

const addrNoPass = deriveFirstAddress(rootNoPass);
const addrWithPass = deriveFirstAddress(rootWithPass);

const userInput =
	"  abandon  ABANDON   abandon  abandon  abandon  abandon  abandon  abandon  abandon  abandon  abandon  about  ";

// Normalize mnemonic (trim, lowercase, single spaces)
const normalized = userInput.trim().toLowerCase().replace(/\s+/g, " ");

for (let account = 0; account < 3; account++) {
	for (let index = 0; index < 2; index++) {
		const hdKey = HDWallet.deriveEthereum(root, account, index);
		const privateKey = HDWallet.getPrivateKey(hdKey);
		if (!privateKey) continue;

		const publicKey = Secp256k1.derivePublicKey(privateKey);
		const address = Address.fromPublicKey(publicKey);
	}
}

const testMnemonic = Bip39.generateMnemonic(128);
const testWords = testMnemonic.split(" ");

// Change last word
testWords[testWords.length - 1] = "zoo";
const invalidMnemonic = testWords.join(" ");

// Helper function
function deriveFirstAddress(
	hdRoot: ReturnType<typeof HDWallet.fromSeed>,
): ReturnType<typeof Address.fromPublicKey> {
	const hdKey = HDWallet.deriveEthereum(hdRoot, 0, 0);
	const privateKey = HDWallet.getPrivateKey(hdKey);
	if (!privateKey) throw new Error("No private key");
	const publicKey = Secp256k1.derivePublicKey(privateKey);
	return Address.fromPublicKey(publicKey);
}
