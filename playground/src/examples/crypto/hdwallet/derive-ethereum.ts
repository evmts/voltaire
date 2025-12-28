import { Bip39, HDWallet, Hex } from "@tevm/voltaire";
// HD Wallet: Derive Ethereum accounts using BIP-44

// Generate master key
const mnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const seed = await Bip39.mnemonicToSeed(mnemonic);
const root = HDWallet.fromSeed(seed);

// Derive first Ethereum account (m/44'/60'/0'/0/0)
const eth0 = HDWallet.deriveEthereum(root, 0, 0);

// Derive multiple addresses in same account
const eth1 = HDWallet.deriveEthereum(root, 0, 1);
const eth2 = HDWallet.deriveEthereum(root, 0, 2);

// Derive second account
const account1 = HDWallet.deriveEthereum(root, 1, 0);

// Verify different accounts produce different keys
const key0 = HDWallet.getPrivateKey(eth0);
if (!key0) throw new Error("Private key not available");
const key1 = HDWallet.getPrivateKey(account1);
if (!key1) throw new Error("Private key not available");
const different = !key0.every((b, i) => b === key1[i]);
