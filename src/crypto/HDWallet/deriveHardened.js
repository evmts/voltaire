/**
 * Derive hardened child key
 *
 * @param {import('./types.js').HDNode} node - Parent HD node
 * @param {number} index - Child index (will be made hardened)
 * @returns {import('./types.js').HDNode} Derived HD node
 */
export function deriveHardened(node, index) {
  const { derive } = await import("./derive.js");
  const HARDENED = 0x80000000;
  return derive(node, [HARDENED + index]);
}
