// HD Wallet: Extended keys (xprv/xpub) export and import
import * as Bip39 from "../../../crypto/Bip39/Bip39.js";
import * as HDWallet from "../../../crypto/HDWallet/HDWallet.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Generate master key
const mnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const seed = await Bip39.mnemonicToSeed(mnemonic);
const root = HDWallet.fromSeed(seed);

// Export extended private key (xprv)
const xprv = HDWallet.toExtendedPrivateKey(root);

// Export extended public key (xpub)
const xpub = HDWallet.toExtendedPublicKey(root);
const importedPriv = HDWallet.fromExtendedKey(xprv);
const originalKey = HDWallet.getPrivateKey(root)!;
const importedKey = HDWallet.getPrivateKey(importedPriv)!;
const keysMatch = originalKey.every((b, i) => b === importedKey[i]);
const watchOnly = HDWallet.fromPublicExtendedKey(xpub);
const child0 = HDWallet.deriveChild(watchOnly, 0);
const child1 = HDWallet.deriveChild(watchOnly, 1);
const publicOnlyKey = HDWallet.toPublic(root);
const accountLevel = HDWallet.derivePath(root, "m/44'/60'/0'");
const accountXpub = HDWallet.toExtendedPublicKey(accountLevel);
