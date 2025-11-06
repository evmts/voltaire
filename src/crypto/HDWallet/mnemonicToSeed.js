/**
 * Convert BIP-39 mnemonic to seed
 *
 * @param {string | string[]} mnemonic - Mnemonic words (array or space-separated string)
 * @param {string} [password] - Optional passphrase
 * @returns {Uint8Array} 512-bit seed
 */
export function mnemonicToSeed(mnemonic, password) {
  const { libwally } = await import("./ffi.js");

  const mnemonicStr =
    typeof mnemonic === "string" ? mnemonic : mnemonic.join(" ");
  const seed = Buffer.alloc(64);

  const result = libwally.hdwallet_mnemonic_to_seed(
    mnemonicStr,
    password ?? null,
    seed,
  );

  if (result !== 0) {
    throw new Error("Failed to convert mnemonic to seed");
  }

  return new Uint8Array(seed);
}
