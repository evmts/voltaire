/**
 * Free HD node resources
 *
 * @param {import('./types.js').HDNode} node - HD node to free
 */
export async function free(node) {
	const { getLibwally } = await import("./ffi.js");
	const libwally = await getLibwally();
	libwally.hdwallet_free(node.handle);
}
