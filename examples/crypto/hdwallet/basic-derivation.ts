/**
 * Basic HD Wallet Derivation
 *
 * Demonstrates:
 * - Creating HD wallet from seed
 * - BIP-32 path derivation
 * - Deriving Ethereum addresses (BIP-44)
 * - Hardened vs normal derivation
 * - Extended keys (xprv/xpub)
 */

import * as Bip39 from "../../../src/crypto/Bip39/index.js";
import * as HDWallet from "../../../src/crypto/HDWallet/index.js";
import * as Secp256k1 from "../../../src/crypto/Secp256k1/index.js";
import * as Address from "../../../src/primitives/Address/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

const mnemonic = Bip39.generateMnemonic(256);
const seed = await Bip39.mnemonicToSeed(mnemonic);

const root = HDWallet.fromSeed(seed);

const paths = [
	"m/44'/60'/0'/0/0", // Ethereum account 0, address 0
	"m/44'/60'/0'/0/1", // Ethereum account 0, address 1
	"m/44'/60'/0'/0/2", // Ethereum account 0, address 2
	"m/44'/60'/1'/0/0", // Ethereum account 1, address 0
];

for (const path of paths) {
	const hdKey = HDWallet.derivePath(root, path);
	const privateKey = HDWallet.getPrivateKey(hdKey);
	if (!privateKey) continue;

	const publicKey = Secp256k1.derivePublicKey(privateKey);
	const address = Address.fromPublicKey(publicKey);
}

for (let i = 0; i < 5; i++) {
	const hdKey = HDWallet.deriveEthereum(root, 0, i);
	const privateKey = HDWallet.getPrivateKey(hdKey);
	if (!privateKey) continue;

	const publicKey = Secp256k1.derivePublicKey(privateKey);
	const address = Address.fromPublicKey(publicKey);
}

// Hardened derivation (requires private key)
const hardened = HDWallet.derivePath(root, "m/44'/60'/0'");

// Normal derivation (can use public key)
const normal = HDWallet.derivePath(hardened, "m/0/0");

const xprv = HDWallet.toExtendedPrivateKey(root);
const xpub = HDWallet.toExtendedPublicKey(root);

const importedRoot = HDWallet.fromExtendedKey(xprv);
const importedXprv = HDWallet.toExtendedPrivateKey(importedRoot);

const watchOnly = HDWallet.fromPublicExtendedKey(xpub);

// Can derive normal addresses
const watchOnlyChild = HDWallet.deriveChild(watchOnly, 0);
const watchOnlyPubKey = HDWallet.getPublicKey(watchOnlyChild);

const validPaths = ["m/44'/60'/0'/0/0", "m/0", "m/44h/60h/0h/0/0"];

const invalidPaths = [
	"44'/60'/0'", // Missing 'm'
	"m/44'/60'/a", // Invalid character
	"invalid", // Not a path
];
for (const path of validPaths) {
}
for (const path of invalidPaths) {
}
for (let account = 0; account < 3; account++) {
	const hdKey = HDWallet.deriveEthereum(root, account, 0);
	const privateKey = HDWallet.getPrivateKey(hdKey);
	if (!privateKey) continue;

	const publicKey = Secp256k1.derivePublicKey(privateKey);
	const address = Address.fromPublicKey(publicKey);
}
