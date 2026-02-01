/**
 * Derive child key from path
 *
 * @param {import('./types.js').HDNode} node - Parent HD node
 * @param {string | import('./types.js').HDPath} path - Derivation path (e.g. "m/44'/60'/0'/0/0" or array)
 * @returns {Promise<import('./types.js').HDNode>} Derived HD node
 * @throws {DerivationError} If child key derivation fails
 */
export function derive(node: import("./types.js").HDNode, path: string | import("./types.js").HDPath): Promise<import("./types.js").HDNode>;
//# sourceMappingURL=derive.d.ts.map