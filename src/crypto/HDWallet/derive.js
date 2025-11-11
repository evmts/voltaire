import { DerivationError } from "./errors.js";

/**
 * Derive child key from path
 *
 * @param {import('./types.js').HDNode} node - Parent HD node
 * @param {string | import('./types.js').HDPath} path - Derivation path (e.g. "m/44'/60'/0'/0/0" or array)
 * @returns {Promise<import('./types.js').HDNode>} Derived HD node
 * @throws {DerivationError} If child key derivation fails
 */
export async function derive(node, path) {
	const { libwally } = await import("./ffi.js");
	const { parsePath } = await import("./parsePath.js");

	const pathArray = typeof path === "string" ? parsePath(path) : path;
	const pathBuf = Buffer.alloc(pathArray.length * 4);

	for (let i = 0; i < pathArray.length; i++) {
		const index = pathArray[i];
		if (index !== undefined) {
			pathBuf.writeUInt32LE(index, i * 4);
		}
	}

	const handle = libwally.hdwallet_derive(
		node.handle,
		pathBuf,
		pathArray.length,
	);

	if (handle === 0) {
		throw new DerivationError("Failed to derive child key", {
			code: "DERIVATION_FAILED",
			context: { path: typeof path === "string" ? path : pathArray },
			docsPath: "/crypto/hdwallet/derive#error-handling",
		});
	}

	return { handle };
}
