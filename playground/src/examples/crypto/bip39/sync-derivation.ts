// Synchronous seed derivation with mnemonicToSeedSync
import * as Bip39 from "../../../crypto/BIP39/Bip39.js";
import * as Hex from "../../../primitives/Hex/index.js";

const mnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

// Synchronous seed derivation
const seedSync = Bip39.mnemonicToSeedSync(mnemonic);
console.log("Sync seed length:", seedSync.length, "bytes");
console.log(
	"Sync seed (hex):",
	Hex.fromBytes(seedSync).toString().slice(0, 32) + "...",
);

// With passphrase
const seedSyncPass = Bip39.mnemonicToSeedSync(mnemonic, "TREZOR");
console.log(
	"\nWith passphrase (hex):",
	Hex.fromBytes(seedSyncPass).toString().slice(0, 32) + "...",
);

// Sync and async produce identical results
const seedAsync = await Bip39.mnemonicToSeed(mnemonic);
const seedsMatch = seedSync.every((byte, i) => byte === seedAsync[i]);
console.log("\nSync matches async:", seedsMatch);

// Sync with passphrase matches async
const seedAsyncPass = await Bip39.mnemonicToSeed(mnemonic, "TREZOR");
const seedsMatchPass = seedSyncPass.every(
	(byte, i) => byte === seedAsyncPass[i],
);
console.log("Sync with passphrase matches async:", seedsMatchPass);

// Deterministic
const s1 = Bip39.mnemonicToSeedSync(mnemonic, "password");
const s2 = Bip39.mnemonicToSeedSync(mnemonic, "password");
console.log(
	"\nDeterministic:",
	Hex.fromBytes(s1).toString() === Hex.fromBytes(s2).toString(),
);

// Different passphrases produce different seeds
const seed1 = Bip39.mnemonicToSeedSync(mnemonic, "pass1");
const seed2 = Bip39.mnemonicToSeedSync(mnemonic, "pass2");
console.log(
	"Different passphrases:",
	Hex.fromBytes(seed1).toString() !== Hex.fromBytes(seed2).toString(),
);
