/**
 * Generate ERC-3448 MetaProxy bytecode with metadata
 *
 * ERC-3448 extends ERC-1167 minimal proxy by appending metadata to the bytecode.
 * Structure:
 * - 10 bytes: creation code (3d602d80600a3d3981f3)
 * - 45 bytes: runtime code (363d3d373d3d3d363d73[address]5af43d82803e903d91602b57fd5bf3)
 * - N bytes: metadata (arbitrary data)
 * - 32 bytes: metadata length as uint256 (big-endian)
 *
 * Total: 87 + N bytes
 *
 * @see https://eips.ethereum.org/EIPS/eip-3448
 * @param {Uint8Array} implementation - 20-byte implementation address
 * @param {Uint8Array} metadata - Metadata to append (arbitrary length)
 * @returns {Uint8Array} Complete MetaProxy bytecode
 */
export function generateErc3448(implementation, metadata) {
    if (implementation.length !== 20) {
        throw new Error(`Implementation address must be 20 bytes, got ${implementation.length}`);
    }
    // Total size: 55 (ERC-1167) + metadata.length + 32 (length encoding)
    const totalSize = 55 + metadata.length + 32;
    const bytecode = new Uint8Array(totalSize);
    // Creation code (10 bytes): 3d602d80600a3d3981f3
    bytecode[0] = 0x3d; // RETURNDATASIZE
    bytecode[1] = 0x60; // PUSH1
    bytecode[2] = 0x2d; // 45 (runtime code length)
    bytecode[3] = 0x80; // DUP1
    bytecode[4] = 0x60; // PUSH1
    bytecode[5] = 0x0a; // 10 (creation code length)
    bytecode[6] = 0x3d; // RETURNDATASIZE
    bytecode[7] = 0x39; // CODECOPY
    bytecode[8] = 0x81; // DUP2
    bytecode[9] = 0xf3; // RETURN
    // Runtime code prefix (9 bytes): 363d3d373d3d3d363d73
    bytecode[10] = 0x36; // CALLDATASIZE
    bytecode[11] = 0x3d; // RETURNDATASIZE
    bytecode[12] = 0x3d; // RETURNDATASIZE
    bytecode[13] = 0x37; // CALLDATACOPY
    bytecode[14] = 0x3d; // RETURNDATASIZE
    bytecode[15] = 0x3d; // RETURNDATASIZE
    bytecode[16] = 0x3d; // RETURNDATASIZE
    bytecode[17] = 0x36; // CALLDATASIZE
    bytecode[18] = 0x3d; // RETURNDATASIZE
    bytecode[19] = 0x73; // PUSH20
    // Implementation address (20 bytes)
    bytecode.set(implementation, 20);
    // Runtime code suffix (15 bytes): 5af43d82803e903d91602b57fd5bf3
    bytecode[40] = 0x5a; // GAS
    bytecode[41] = 0xf4; // DELEGATECALL
    bytecode[42] = 0x3d; // RETURNDATASIZE
    bytecode[43] = 0x82; // DUP3
    bytecode[44] = 0x80; // DUP1
    bytecode[45] = 0x3e; // RETURNDATACOPY
    bytecode[46] = 0x90; // SWAP1
    bytecode[47] = 0x3d; // RETURNDATASIZE
    bytecode[48] = 0x91; // SWAP2
    bytecode[49] = 0x60; // PUSH1
    bytecode[50] = 0x2b; // 43
    bytecode[51] = 0x57; // JUMPI
    bytecode[52] = 0xfd; // REVERT
    bytecode[53] = 0x5b; // JUMPDEST
    bytecode[54] = 0xf3; // RETURN
    // Metadata (N bytes)
    if (metadata.length > 0) {
        bytecode.set(metadata, 55);
    }
    // Metadata length as uint256 big-endian (32 bytes)
    // Convert metadata.length to big-endian bytes
    let len = metadata.length;
    for (let i = 31; i >= 0; i--) {
        bytecode[55 + metadata.length + i] = len & 0xff;
        len = len >>> 8;
    }
    return bytecode;
}
