import { Bip39, HDWallet, Hex } from "voltaire";
// HD Wallet: Derive child keys sequentially

// Generate master key
const mnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const seed = await Bip39.mnemonicToSeed(mnemonic);
const root = HDWallet.fromSeed(seed);

const m44 = HDWallet.deriveChild(root, HDWallet.HARDENED_OFFSET + 44);

const m44_60 = HDWallet.deriveChild(m44, HDWallet.HARDENED_OFFSET + 60);

const m44_60_0 = HDWallet.deriveChild(m44_60, HDWallet.HARDENED_OFFSET + 0);

const m44_60_0_0 = HDWallet.deriveChild(m44_60_0, 0);

const final = HDWallet.deriveChild(m44_60_0_0, 0);

// Compare with direct path derivation
const direct = HDWallet.derivePath(root, "m/44'/60'/0'/0/0");

const seqKey = HDWallet.getPrivateKey(final)!;
const dirKey = HDWallet.getPrivateKey(direct)!;
const identical = seqKey.every((b, i) => b === dirKey[i]);
const accountLevel = HDWallet.derivePath(root, "m/44'/60'/0'/0");

for (let i = 0; i < 5; i++) {
	const child = HDWallet.deriveChild(accountLevel, i);
	const pk = HDWallet.getPrivateKey(child)!;
}
