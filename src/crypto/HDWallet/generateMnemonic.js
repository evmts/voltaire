import { InvalidMnemonicError } from "./errors.js";

/**
 * Generate BIP-39 mnemonic from entropy
 *
 * @param {128 | 256} [strength=128] - Entropy strength in bits
 * @returns {Promise<string[]>} Mnemonic words
 * @throws {InvalidMnemonicError} If strength is invalid or generation fails
 */
export async function generateMnemonic(strength = 128) {
	if (strength !== 128 && strength !== 256) {
		throw new InvalidMnemonicError("Strength must be 128 or 256", {
			code: -32602,
			context: { strength, validValues: [128, 256] },
			docsPath: "/crypto/hdwallet/generate-mnemonic#error-handling",
		});
	}

	const { libwally } = await import("./ffi.js");

	const entropyLen = strength / 8;
	const entropy = new Uint8Array(entropyLen);
	// Cross-platform secure random fill
	if (
		typeof globalThis.crypto !== "undefined" &&
		globalThis.crypto.getRandomValues
	) {
		globalThis.crypto.getRandomValues(entropy);
	} else {
		const nodeCrypto = await import("node:crypto");
		if (nodeCrypto.webcrypto?.getRandomValues) {
			nodeCrypto.webcrypto.getRandomValues(entropy);
		} else {
			const buf = nodeCrypto.randomBytes(entropyLen);
			for (let i = 0; i < entropyLen; i++)
				entropy[i] = /** @type {number} */ (buf[i]);
		}
	}

	const outBuf = new Uint8Array(256);
	const result = libwally.hdwallet_generate_mnemonic(
		entropy,
		entropyLen,
		outBuf,
		256,
	);

	if (result < 0) {
		throw new InvalidMnemonicError("Failed to generate mnemonic", {
			code: -32000,
			context: { strength, result },
			docsPath: "/crypto/hdwallet/generate-mnemonic#error-handling",
		});
	}

	const mnemonicStr = new TextDecoder().decode(outBuf.slice(0, result));
	return mnemonicStr.split(" ");
}
