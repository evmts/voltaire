// HD Wallet: Master key generation from seed
import * as Bip39 from "../../../crypto/Bip39/Bip39.js";
import * as HDWallet from "../../../crypto/HDWallet/HDWallet.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Generate mnemonic and seed
const mnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const seed = await Bip39.mnemonicToSeed(mnemonic);

console.log("Seed length:", seed.length, "bytes");
console.log(
	"Seed (first 16 bytes):",
	Hex.fromBytes(seed.slice(0, 16)).toString(),
);

// Create master HD key from seed
const masterKey = HDWallet.fromSeed(seed);

// Get master key components
const privateKey = HDWallet.getPrivateKey(masterKey);
const publicKey = HDWallet.getPublicKey(masterKey);
const chainCode = HDWallet.getChainCode(masterKey);

console.log("Master private key length:", privateKey?.length, "bytes");
console.log("Master public key length:", publicKey?.length, "bytes");
console.log("Chain code length:", chainCode?.length, "bytes");

// Export extended keys
const xprv = HDWallet.toExtendedPrivateKey(masterKey);
const xpub = HDWallet.toExtendedPublicKey(masterKey);

console.log("xprv:", xprv.slice(0, 20) + "...");
console.log("xpub:", xpub.slice(0, 20) + "...");
console.log("Can derive hardened:", HDWallet.canDeriveHardened(masterKey));
