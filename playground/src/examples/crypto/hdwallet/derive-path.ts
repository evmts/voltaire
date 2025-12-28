import { Bip39, HDWallet, Hex } from "@tevm/voltaire";
// HD Wallet: Custom derivation paths

// Generate master key
const mnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const seed = await Bip39.mnemonicToSeed(mnemonic);
const root = HDWallet.fromSeed(seed);

// Standard Ethereum path
const ethPath = "m/44'/60'/0'/0/0";
const ethKey = HDWallet.derivePath(root, ethPath);

// Bitcoin path
const btcPath = "m/44'/0'/0'/0/0";
const btcKey = HDWallet.derivePath(root, btcPath);

// Custom path with mixed hardened/normal
const customPath = "m/0'/1/2'/3";
const customKey = HDWallet.derivePath(root, customPath);

// Validate paths before deriving
const paths = [
	"m/44'/60'/0'/0/0", // Valid
	"44'/60'/0'/0/0", // Invalid (missing 'm')
	"m/0/1/2", // Valid
	"m//0/1", // Invalid (double slash)
];
paths.forEach((path) => {});
