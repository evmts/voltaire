/**
 * Calculate ERC-7201 namespaced storage slot
 * Formula: keccak256(keccak256(id) - 1) & ~0xff
 * The result has the last byte cleared (set to 0x00)
 * @see https://eips.ethereum.org/EIPS/eip-7201
 * @param {(data: Uint8Array) => Uint8Array} keccak256 - Keccak256 hash function
 * @param {string} id - Namespace identifier string
 * @returns {Uint8Array} 32-byte storage slot
 */
export function calculateErc7201(keccak256, id) {
    // First hash: keccak256(id)
    const encoder = new TextEncoder();
    const idBytes = encoder.encode(id);
    const firstHash = keccak256(idBytes);
    // Convert to bigint, subtract 1
    let value = 0n;
    for (let i = 0; i < 32; i++) {
        value = (value << 8n) | BigInt(/** @type {*} */ (firstHash[i]));
    }
    value = value - 1n;
    // Convert back to bytes
    const intermediateBytes = new Uint8Array(32);
    for (let i = 31; i >= 0; i--) {
        intermediateBytes[i] = Number(value & 0xffn);
        value = value >> 8n;
    }
    // Second hash: keccak256(result - 1)
    const secondHash = keccak256(intermediateBytes);
    // Clear last byte: & ~0xff
    secondHash[31] = 0x00;
    return secondHash;
}
