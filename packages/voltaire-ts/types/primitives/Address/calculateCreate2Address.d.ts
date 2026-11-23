/**
 * Factory function to create calculateCreate2Address with injected keccak256 dependency
 *
 * @param {Object} deps - Dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(address: import('./AddressType.js').AddressType, salt: import('../Hash/HashType.js').HashType, initCode: import('../Bytecode/BytecodeType.js').BrandedBytecode) => import('./AddressType.js').AddressType}
 */
export function CalculateCreate2Address({ keccak256 }: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): (address: import("./AddressType.js").AddressType, salt: import("../Hash/HashType.js").HashType, initCode: import("../Bytecode/BytecodeType.js").BrandedBytecode) => import("./AddressType.js").AddressType;
//# sourceMappingURL=calculateCreate2Address.d.ts.map