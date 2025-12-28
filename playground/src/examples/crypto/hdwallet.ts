import { Address, Bip39, HDWallet, Hex, Secp256k1 } from "@tevm/voltaire";

// HD Wallet - Hierarchical Deterministic key derivation (BIP-32/44)

// Standard test mnemonic (DO NOT use in production!)
const mnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

// Convert mnemonic to seed (64 bytes)
const seed = await Bip39.mnemonicToSeed(mnemonic);

// Create root (master) extended key
const root = HDWallet.fromSeed(seed);

// Derive Ethereum account using BIP-44 path: m/44'/60'/0'/0/0
// 44' = BIP-44, 60' = Ethereum, 0' = account, 0 = external, 0 = first address
const eth0 = HDWallet.deriveEthereum(root, 0, 0);
const privateKey0 = HDWallet.getPrivateKey(eth0)!;
const publicKey0 = Secp256k1.derivePublicKey(privateKey0);
const address0 = Address.fromPublicKey(publicKey0);

// Derive more addresses in same account
const eth1 = HDWallet.deriveEthereum(root, 0, 1);
const eth2 = HDWallet.deriveEthereum(root, 0, 2);

const addr1 = Address.fromPublicKey(
	Secp256k1.derivePublicKey(HDWallet.getPrivateKey(eth1)!),
);
const addr2 = Address.fromPublicKey(
	Secp256k1.derivePublicKey(HDWallet.getPrivateKey(eth2)!),
);

// Derive second account
const account1 = HDWallet.deriveEthereum(root, 1, 0);
const addr1_0 = Address.fromPublicKey(
	Secp256k1.derivePublicKey(HDWallet.getPrivateKey(account1)!),
);

// Custom derivation path: m/44'/60'/0'/0/5
const custom = HDWallet.derivePath(root, "m/44'/60'/0'/0/5");
const customAddr = Address.fromPublicKey(
	Secp256k1.derivePublicKey(HDWallet.getPrivateKey(custom)!),
);

// Hardened derivation (uses ')
// Hardened keys cannot be computed from parent public key
const hardened = HDWallet.derivePath(root, "m/44'/60'/0'");

// Get extended public key (for watch-only wallets)
const xpub = HDWallet.getPublicKey(eth0);

// Verify keys are deterministic (same mnemonic = same keys)
const seed2 = await Bip39.mnemonicToSeed(mnemonic);
const root2 = HDWallet.fromSeed(seed2);
const eth0_2 = HDWallet.deriveEthereum(root2, 0, 0);
const key0_2 = HDWallet.getPrivateKey(eth0_2)!;
const keysMatch = Hex.fromBytes(privateKey0) === Hex.fromBytes(key0_2);
