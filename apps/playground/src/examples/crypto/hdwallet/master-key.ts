import { Bip39, HDWallet, Hex } from "@tevm/voltaire";
// HD Wallet: Master key generation from seed

// Generate mnemonic and seed
const mnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const seed = await Bip39.mnemonicToSeed(mnemonic);

// Create master HD key from seed
const masterKey = HDWallet.fromSeed(seed);

// Get master key components
const privateKey = HDWallet.getPrivateKey(masterKey);
const publicKey = HDWallet.getPublicKey(masterKey);
const chainCode = HDWallet.getChainCode(masterKey);

// Export extended keys
const xprv = HDWallet.toExtendedPrivateKey(masterKey);
const xpub = HDWallet.toExtendedPublicKey(masterKey);
