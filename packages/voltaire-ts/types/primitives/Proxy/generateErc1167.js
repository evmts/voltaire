/**
 * Generate ERC-1167 minimal proxy bytecode
 * Creates the 55-byte creation code and 45-byte runtime code for a minimal proxy
 * @see https://eips.ethereum.org/EIPS/eip-1167
 * @param {Uint8Array} implementationAddress - 20-byte implementation address
 * @returns {Uint8Array} 55-byte creation code
 */
export function generateErc1167(implementationAddress) {
    if (implementationAddress.length !== 20) {
        throw new Error(`Implementation address must be 20 bytes, got ${implementationAddress.length}`);
    }
    // Creation code: 3d602d80600a3d3981f3 (10 bytes)
    // Runtime code: 363d3d373d3d3d363d73 + address (20 bytes) + 5af43d82803e903d91602b57fd5bf3 (15 bytes)
    // Total: 10 + 45 = 55 bytes
    const bytecode = new Uint8Array(55);
    // Creation code (10 bytes)
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
    // Runtime code prefix (9 bytes)
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
    bytecode.set(implementationAddress, 20);
    // Runtime code suffix (15 bytes)
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
    return bytecode;
}
