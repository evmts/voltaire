/**
 * Check if bytecode is a valid ERC-1167 minimal proxy
 * @see https://eips.ethereum.org/EIPS/eip-1167
 * @param {Uint8Array} bytecode - Bytecode to check
 * @returns {boolean} True if valid ERC-1167 proxy
 */
export function isErc1167(bytecode) {
    // Must be either 45 bytes (runtime) or 55 bytes (creation)
    if (bytecode.length !== 45 && bytecode.length !== 55) {
        return false;
    }
    if (bytecode.length === 55) {
        // Creation code validation
        // Prefix: 3d602d80600a3d3981f3
        if (bytecode[0] !== 0x3d ||
            bytecode[1] !== 0x60 ||
            bytecode[2] !== 0x2d ||
            bytecode[3] !== 0x80 ||
            bytecode[4] !== 0x60 ||
            bytecode[5] !== 0x0a ||
            bytecode[6] !== 0x3d ||
            bytecode[7] !== 0x39 ||
            bytecode[8] !== 0x81 ||
            bytecode[9] !== 0xf3) {
            return false;
        }
        // Runtime prefix within creation code
        if (bytecode[10] !== 0x36 ||
            bytecode[11] !== 0x3d ||
            bytecode[12] !== 0x3d ||
            bytecode[13] !== 0x37 ||
            bytecode[14] !== 0x3d ||
            bytecode[15] !== 0x3d ||
            bytecode[16] !== 0x3d ||
            bytecode[17] !== 0x36 ||
            bytecode[18] !== 0x3d ||
            bytecode[19] !== 0x73) {
            return false;
        }
        // Suffix: 5af43d82803e903d91602b57fd5bf3
        return (bytecode[40] === 0x5a &&
            bytecode[41] === 0xf4 &&
            bytecode[42] === 0x3d &&
            bytecode[43] === 0x82 &&
            bytecode[44] === 0x80 &&
            bytecode[45] === 0x3e &&
            bytecode[46] === 0x90 &&
            bytecode[47] === 0x3d &&
            bytecode[48] === 0x91 &&
            bytecode[49] === 0x60 &&
            bytecode[50] === 0x2b &&
            bytecode[51] === 0x57 &&
            bytecode[52] === 0xfd &&
            bytecode[53] === 0x5b &&
            bytecode[54] === 0xf3);
    }
    // Runtime code validation (45 bytes)
    // Prefix: 363d3d373d3d3d363d73
    if (bytecode[0] !== 0x36 ||
        bytecode[1] !== 0x3d ||
        bytecode[2] !== 0x3d ||
        bytecode[3] !== 0x37 ||
        bytecode[4] !== 0x3d ||
        bytecode[5] !== 0x3d ||
        bytecode[6] !== 0x3d ||
        bytecode[7] !== 0x36 ||
        bytecode[8] !== 0x3d ||
        bytecode[9] !== 0x73) {
        return false;
    }
    // Suffix: 5af43d82803e903d91602b57fd5bf3
    return (bytecode[30] === 0x5a &&
        bytecode[31] === 0xf4 &&
        bytecode[32] === 0x3d &&
        bytecode[33] === 0x82 &&
        bytecode[34] === 0x80 &&
        bytecode[35] === 0x3e &&
        bytecode[36] === 0x90 &&
        bytecode[37] === 0x3d &&
        bytecode[38] === 0x91 &&
        bytecode[39] === 0x60 &&
        bytecode[40] === 0x2b &&
        bytecode[41] === 0x57 &&
        bytecode[42] === 0xfd &&
        bytecode[43] === 0x5b &&
        bytecode[44] === 0xf3);
}
