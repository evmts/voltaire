/**
 * Generate BIP-39 mnemonic from entropy
 *
 * @param {128 | 256} [strength=128] - Entropy strength in bits
 * @returns {string[]} Mnemonic words
 */
export function generateMnemonic(strength = 128) {
  if (strength !== 128 && strength !== 256) {
    throw new Error("Strength must be 128 or 256");
  }

  const { libwally } = await import("./ffi.js");
  const crypto = await import("node:crypto");

  const entropyLen = strength / 8;
  const entropy = Buffer.alloc(entropyLen);
  crypto.randomFillSync(entropy);

  const outBuf = Buffer.alloc(256);
  const result = libwallet.hdwallet_generate_mnemonic(
    entropy,
    entropyLen,
    outBuf,
    256,
  );

  if (result < 0) {
    throw new Error("Failed to generate mnemonic");
  }

  const mnemonicStr = outBuf.toString("utf8", 0, result);
  return mnemonicStr.split(" ");
}
