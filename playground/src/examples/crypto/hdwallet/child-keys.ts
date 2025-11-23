// HD Wallet: Derive child keys sequentially
import * as Bip39 from "../../../crypto/Bip39/Bip39.js";
import * as HDWallet from "../../../crypto/HDWallet/HDWallet.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Generate master key
const mnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const seed = await Bip39.mnemonicToSeed(mnemonic);
const root = HDWallet.fromSeed(seed);

// Derive children one level at a time
console.log("Sequential derivation (building m/44'/60'/0'/0/0):");

const m44 = HDWallet.deriveChild(root, HDWallet.HARDENED_OFFSET + 44);
console.log("m/44' derived");

const m44_60 = HDWallet.deriveChild(m44, HDWallet.HARDENED_OFFSET + 60);
console.log("m/44'/60' derived");

const m44_60_0 = HDWallet.deriveChild(m44_60, HDWallet.HARDENED_OFFSET + 0);
console.log("m/44'/60'/0' derived");

const m44_60_0_0 = HDWallet.deriveChild(m44_60_0, 0);
console.log("m/44'/60'/0'/0 derived");

const final = HDWallet.deriveChild(m44_60_0_0, 0);
console.log("m/44'/60'/0'/0/0 derived");

// Compare with direct path derivation
const direct = HDWallet.derivePath(root, "m/44'/60'/0'/0/0");

const seqKey = HDWallet.getPrivateKey(final)!;
const dirKey = HDWallet.getPrivateKey(direct)!;
const identical = seqKey.every((b, i) => b === dirKey[i]);

console.log("\nSequential = Direct path:", identical);

// Derive multiple children from account level
console.log("\nDeriving 5 addresses from account level:");
const accountLevel = HDWallet.derivePath(root, "m/44'/60'/0'/0");

for (let i = 0; i < 5; i++) {
	const child = HDWallet.deriveChild(accountLevel, i);
	const pk = HDWallet.getPrivateKey(child)!;
	console.log(
		`  Address ${i}: ${Hex.fromBytes(pk).toString().slice(0, 16)}...`,
	);
}
