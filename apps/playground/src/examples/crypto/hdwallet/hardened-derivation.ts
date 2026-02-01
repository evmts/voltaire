import { Bip39, HDWallet, Hex } from "@tevm/voltaire";
// HD Wallet: Hardened vs non-hardened derivation

// Generate master key
const mnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const seed = await Bip39.mnemonicToSeed(mnemonic);
const root = HDWallet.fromSeed(seed);
const normal0 = HDWallet.deriveChild(root, 0);
const normal1 = HDWallet.deriveChild(root, 1);
const normal2 = HDWallet.deriveChild(root, 2);

const hardened0 = HDWallet.deriveChild(root, HDWallet.HARDENED_OFFSET + 0);
const hardened1 = HDWallet.deriveChild(root, HDWallet.HARDENED_OFFSET + 1);
const hardened2 = HDWallet.deriveChild(root, HDWallet.HARDENED_OFFSET + 2);

// Compare normal vs hardened at same index
const normalKey = HDWallet.getPrivateKey(normal0);
if (!normalKey) throw new Error("Private key not available");
const hardenedKey = HDWallet.getPrivateKey(hardened0);
if (!hardenedKey) throw new Error("Private key not available");
const different = !normalKey.every((b, i) => b === hardenedKey[i]);
const xpub = HDWallet.toExtendedPublicKey(root);
const pubOnly = HDWallet.fromPublicExtendedKey(xpub);
