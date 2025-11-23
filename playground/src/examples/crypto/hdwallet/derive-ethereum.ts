// HD Wallet: Derive Ethereum accounts using BIP-44
import * as Bip39 from "../../../crypto/Bip39/Bip39.js";
import * as HDWallet from "../../../crypto/HDWallet/HDWallet.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Generate master key
const mnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const seed = await Bip39.mnemonicToSeed(mnemonic);
const root = HDWallet.fromSeed(seed);

// Derive first Ethereum account (m/44'/60'/0'/0/0)
const eth0 = HDWallet.deriveEthereum(root, 0, 0);
console.log("Account 0, Address 0 (m/44'/60'/0'/0/0):");
console.log(
	"  Private key:",
	Hex.fromBytes(HDWallet.getPrivateKey(eth0)!).toString().slice(0, 16) + "...",
);
console.log(
	"  Public key:",
	Hex.fromBytes(HDWallet.getPublicKey(eth0)!).toString().slice(0, 16) + "...",
);

// Derive multiple addresses in same account
const eth1 = HDWallet.deriveEthereum(root, 0, 1);
const eth2 = HDWallet.deriveEthereum(root, 0, 2);

console.log("\nAccount 0, Address 1 (m/44'/60'/0'/0/1):");
console.log(
	"  Private key:",
	Hex.fromBytes(HDWallet.getPrivateKey(eth1)!).toString().slice(0, 16) + "...",
);

console.log("\nAccount 0, Address 2 (m/44'/60'/0'/0/2):");
console.log(
	"  Private key:",
	Hex.fromBytes(HDWallet.getPrivateKey(eth2)!).toString().slice(0, 16) + "...",
);

// Derive second account
const account1 = HDWallet.deriveEthereum(root, 1, 0);
console.log("\nAccount 1, Address 0 (m/44'/60'/1'/0/0):");
console.log(
	"  Private key:",
	Hex.fromBytes(HDWallet.getPrivateKey(account1)!).toString().slice(0, 16) +
		"...",
);

// Verify different accounts produce different keys
const key0 = HDWallet.getPrivateKey(eth0)!;
const key1 = HDWallet.getPrivateKey(account1)!;
const different = !key0.every((b, i) => b === key1[i]);
console.log("\nDifferent accounts = different keys:", different);
