import * as Bip39 from "../../../crypto/Bip39/Bip39.js";
import * as HDWallet from "../../../crypto/HDWallet/HDWallet.js";
import * as Address from "../../../primitives/Address/index.js";
import * as PrivateKey from "../../../primitives/PrivateKey/index.js";
const mnemonic = Bip39.generateMnemonic(128);
const seed = await Bip39.mnemonicToSeed(mnemonic);
const root = HDWallet.fromSeed(seed);

for (let i = 0; i < 5; i++) {
	// BIP-44 path for Ethereum: m/44'/60'/0'/0/i
	const path = `m/44'/60'/0'/0/${i}`;
	const account = HDWallet.derivePath(root, path);
	const privateKeyBytes = HDWallet.getPrivateKey(account);

	// Convert to hex for PrivateKey module
	const pkHex = `0x${Array.from(privateKeyBytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
	const address = PrivateKey.toAddress(pkHex);
}
const coins = [
	{ name: "Ethereum", coinType: 60 },
	{ name: "Bitcoin", coinType: 0 },
	{ name: "Testnet", coinType: 1 },
];

for (const coin of coins) {
	const path = `m/44'/${coin.coinType}'/0'/0/0`;
	const account = HDWallet.derivePath(root, path);
	const pkBytes = HDWallet.getPrivateKey(account);
	const pkHex = `0x${Array.from(pkBytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
	const addr = PrivateKey.toAddress(pkHex);
}
const xprv = HDWallet.toExtendedPrivateKey(root);
const xpub = HDWallet.toExtendedPublicKey(root);
