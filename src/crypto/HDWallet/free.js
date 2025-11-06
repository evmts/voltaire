/**
 * Free HD node resources
 *
 * @param {import('./types.js').HDNode} node - HD node to free
 */
export function free(node) {
  const { libwally } = await import("./ffi.js");
  libwally.hdwallet_free(node.handle);
}
