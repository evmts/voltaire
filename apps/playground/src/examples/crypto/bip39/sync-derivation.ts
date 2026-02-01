import { Bip39, Hex } from "@tevm/voltaire";
// Synchronous seed derivation with mnemonicToSeedSync

const mnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

// Synchronous seed derivation
const seedSync = Bip39.mnemonicToSeedSync(mnemonic);

// With passphrase
const seedSyncPass = Bip39.mnemonicToSeedSync(mnemonic, "TREZOR");

// Sync and async produce identical results
const seedAsync = await Bip39.mnemonicToSeed(mnemonic);
const seedsMatch = seedSync.every((byte, i) => byte === seedAsync[i]);

// Sync with passphrase matches async
const seedAsyncPass = await Bip39.mnemonicToSeed(mnemonic, "TREZOR");
const seedsMatchPass = seedSyncPass.every(
	(byte, i) => byte === seedAsyncPass[i],
);

// Deterministic
const s1 = Bip39.mnemonicToSeedSync(mnemonic, "password");
const s2 = Bip39.mnemonicToSeedSync(mnemonic, "password");

// Different passphrases produce different seeds
const seed1 = Bip39.mnemonicToSeedSync(mnemonic, "pass1");
const seed2 = Bip39.mnemonicToSeedSync(mnemonic, "pass2");
