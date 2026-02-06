/**
 * Factory function to create calculateCreate2Address with injected keccak256 dependency
 *
 * @param {Object} deps - Dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {function(import('./AddressType.js').AddressType, import('../Hash/HashType.js').HashType, import('../Bytecode/BytecodeType.js').BrandedBytecode): import('./AddressType.js').AddressType}
 */
export function CalculateCreate2Address({ keccak256 }: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): (arg0: import("./AddressType.js").AddressType, arg1: import("../Hash/HashType.js").HashType, arg2: import("../Bytecode/BytecodeType.js").BrandedBytecode) => import("./AddressType.js").AddressType;
//# sourceMappingURL=calculateCreate2Address.d.ts.map