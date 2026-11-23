import { DerivationError, InvalidPathError } from "./errors.js";
import { parsePath } from "./parsePath.js";

/**
 * Derive child key from path
 *
 * @param {import('./types.js').HDNode} node - Parent HD node
 * @param {string | import('./types.js').HDPath} path - Derivation path (e.g. "m/44'/60'/0'/0/0" or array)
 * @returns {Promise<import('./types.js').HDNode>} Derived HD node
 * @throws {InvalidPathError} If the path contains an invalid child index
 * @throws {DerivationError} If child key derivation fails
 */
export async function derive(node, path) {
	const pathArray = typeof path === "string" ? parsePath(path) : path;
	const pathBuf = new Uint8Array(pathArray.length * 4);
	const view = new DataView(pathBuf.buffer);

	for (let i = 0; i < pathArray.length; i++) {
		const index = pathArray[i];
		if (
			index === undefined ||
			!Number.isInteger(index) ||
			index < 0 ||
			index > 0xffffffff
		) {
			throw new InvalidPathError(
				`Invalid child index at path position ${i}: ${index}`,
				{
					code: -32602,
					context: { index, position: i },
					docsPath: "/crypto/hdwallet/derive#error-handling",
				},
			);
		}
		view.setUint32(i * 4, index, true);
	}

	const { getLibwally } = await import("./ffi.js");
	const libwally = await getLibwally();
	const handle = libwally.hdwallet_derive(
		node.handle,
		pathBuf,
		pathArray.length,
	);

	if (handle === 0) {
		throw new DerivationError("Failed to derive child key", {
			code: -32000,
			context: { path: typeof path === "string" ? path : pathArray },
			docsPath: "/crypto/hdwallet/derive#error-handling",
		});
	}

	return { handle };
}
