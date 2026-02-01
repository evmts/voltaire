import { Bip39, HDWallet, Hex } from "@tevm/voltaire";
// HD Wallet: Watch-only wallet (xpub for monitoring without spending)

const mnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const seed = await Bip39.mnemonicToSeed(mnemonic);
const root = HDWallet.fromSeed(seed);

// Derive to account level
const accountLevel = HDWallet.derivePath(root, "m/44'/60'/0'");

// Export account-level xpub for watch-only system
const accountXpub = HDWallet.toExtendedPublicKey(accountLevel);

// Keep xprv secret on cold storage!
const accountXprv = HDWallet.toExtendedPrivateKey(accountLevel);
const watchOnly = HDWallet.fromPublicExtendedKey(accountXpub);
for (let i = 0; i < 5; i++) {
	// Derive m/0/i from account level
	const changeLevel = HDWallet.deriveChild(watchOnly, 0);
	const address = HDWallet.deriveChild(changeLevel, i);
	const pubKey = HDWallet.getPublicKey(address);
	if (!pubKey) throw new Error("Public key not available");
}
const testAddr = HDWallet.deriveChild(HDWallet.deriveChild(watchOnly, 0), 0);
const coldChild = HDWallet.deriveChild(
	HDWallet.deriveChild(accountLevel, 0),
	0,
);
const coldPubKey = HDWallet.getPublicKey(coldChild);
if (!coldPubKey) throw new Error("Public key not available");
const coldPrivKey = HDWallet.getPrivateKey(coldChild);
if (!coldPrivKey) throw new Error("Private key not available");

const watchChild = HDWallet.deriveChild(HDWallet.deriveChild(watchOnly, 0), 0);
const watchPubKey = HDWallet.getPublicKey(watchChild);
if (!watchPubKey) throw new Error("Public key not available");
