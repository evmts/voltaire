/**
 * Factory: Get the EIP-191 personal sign message hash
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(message: import('./SiweMessageType.js').SiweMessageType) => Uint8Array} Function that hashes SIWE messages with EIP-191 prefix
 */
export function GetMessageHash({ keccak256 }: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): (message: import("./SiweMessageType.js").SiweMessageType) => Uint8Array;
//# sourceMappingURL=getMessageHash.d.ts.map