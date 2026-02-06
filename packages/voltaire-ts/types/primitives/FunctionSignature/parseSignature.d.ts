/**
 * Parse function signature into name and input types
 *
 * @param {string} signature - Function signature (e.g., "transfer(address,uint256)")
 * @returns {{ name: string, inputs: string[] }} Parsed signature
 * @throws {Error} If signature is invalid
 * @example
 * ```javascript
 * const { name, inputs } = parseSignature('transfer(address,uint256)');
 * // { name: 'transfer', inputs: ['address', 'uint256'] }
 * ```
 */
export function parseSignature(signature: string): {
    name: string;
    inputs: string[];
};
//# sourceMappingURL=parseSignature.d.ts.map