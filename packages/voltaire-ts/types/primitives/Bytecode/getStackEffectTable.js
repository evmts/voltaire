/**
 * Stack effect lookup table for EVM opcodes
 * @returns {Map<number, { pop: number; push: number }>}
 */
export function getStackEffectTable() {
    const map = new Map();
    // 0x00: Stop and Arithmetic
    map.set(0x00, { pop: 0, push: 0 }); // STOP
    map.set(0x01, { pop: 2, push: 1 }); // ADD
    map.set(0x02, { pop: 2, push: 1 }); // MUL
    map.set(0x03, { pop: 2, push: 1 }); // SUB
    map.set(0x04, { pop: 2, push: 1 }); // DIV
    map.set(0x05, { pop: 2, push: 1 }); // SDIV
    map.set(0x06, { pop: 2, push: 1 }); // MOD
    map.set(0x07, { pop: 2, push: 1 }); // SMOD
    map.set(0x08, { pop: 3, push: 1 }); // ADDMOD
    map.set(0x09, { pop: 3, push: 1 }); // MULMOD
    map.set(0x0a, { pop: 2, push: 1 }); // EXP
    map.set(0x0b, { pop: 2, push: 1 }); // SIGNEXTEND
    // 0x10: Comparison & Bitwise
    map.set(0x10, { pop: 2, push: 1 }); // LT
    map.set(0x11, { pop: 2, push: 1 }); // GT
    map.set(0x12, { pop: 2, push: 1 }); // SLT
    map.set(0x13, { pop: 2, push: 1 }); // SGT
    map.set(0x14, { pop: 2, push: 1 }); // EQ
    map.set(0x15, { pop: 1, push: 1 }); // ISZERO
    map.set(0x16, { pop: 2, push: 1 }); // AND
    map.set(0x17, { pop: 2, push: 1 }); // OR
    map.set(0x18, { pop: 2, push: 1 }); // XOR
    map.set(0x19, { pop: 1, push: 1 }); // NOT
    map.set(0x1a, { pop: 2, push: 1 }); // BYTE
    map.set(0x1b, { pop: 2, push: 1 }); // SHL
    map.set(0x1c, { pop: 2, push: 1 }); // SHR
    map.set(0x1d, { pop: 2, push: 1 }); // SAR
    // 0x20: SHA3
    map.set(0x20, { pop: 2, push: 1 }); // KECCAK256
    // 0x30: Environmental Information
    map.set(0x30, { pop: 0, push: 1 }); // ADDRESS
    map.set(0x31, { pop: 1, push: 1 }); // BALANCE
    map.set(0x32, { pop: 0, push: 1 }); // ORIGIN
    map.set(0x33, { pop: 0, push: 1 }); // CALLER
    map.set(0x34, { pop: 0, push: 1 }); // CALLVALUE
    map.set(0x35, { pop: 1, push: 1 }); // CALLDATALOAD
    map.set(0x36, { pop: 0, push: 1 }); // CALLDATASIZE
    map.set(0x37, { pop: 3, push: 0 }); // CALLDATACOPY
    map.set(0x38, { pop: 0, push: 1 }); // CODESIZE
    map.set(0x39, { pop: 3, push: 0 }); // CODECOPY
    map.set(0x3a, { pop: 0, push: 1 }); // GASPRICE
    map.set(0x3b, { pop: 1, push: 1 }); // EXTCODESIZE
    map.set(0x3c, { pop: 4, push: 0 }); // EXTCODECOPY
    map.set(0x3d, { pop: 0, push: 1 }); // RETURNDATASIZE
    map.set(0x3e, { pop: 3, push: 0 }); // RETURNDATACOPY
    map.set(0x3f, { pop: 1, push: 1 }); // EXTCODEHASH
    // 0x40: Block Information
    map.set(0x40, { pop: 1, push: 1 }); // BLOCKHASH
    map.set(0x41, { pop: 0, push: 1 }); // COINBASE
    map.set(0x42, { pop: 0, push: 1 }); // TIMESTAMP
    map.set(0x43, { pop: 0, push: 1 }); // NUMBER
    map.set(0x44, { pop: 0, push: 1 }); // DIFFICULTY/PREVRANDAO
    map.set(0x45, { pop: 0, push: 1 }); // GASLIMIT
    map.set(0x46, { pop: 0, push: 1 }); // CHAINID
    map.set(0x47, { pop: 0, push: 1 }); // SELFBALANCE
    map.set(0x48, { pop: 0, push: 1 }); // BASEFEE
    map.set(0x49, { pop: 1, push: 1 }); // BLOBHASH
    map.set(0x4a, { pop: 0, push: 1 }); // BLOBBASEFEE
    // 0x50: Stack, Memory, Storage and Flow
    map.set(0x50, { pop: 1, push: 0 }); // POP
    map.set(0x51, { pop: 1, push: 1 }); // MLOAD
    map.set(0x52, { pop: 2, push: 0 }); // MSTORE
    map.set(0x53, { pop: 2, push: 0 }); // MSTORE8
    map.set(0x54, { pop: 1, push: 1 }); // SLOAD
    map.set(0x55, { pop: 2, push: 0 }); // SSTORE
    map.set(0x56, { pop: 1, push: 0 }); // JUMP
    map.set(0x57, { pop: 2, push: 0 }); // JUMPI
    map.set(0x58, { pop: 0, push: 1 }); // PC
    map.set(0x59, { pop: 0, push: 1 }); // MSIZE
    map.set(0x5a, { pop: 0, push: 1 }); // GAS
    map.set(0x5b, { pop: 0, push: 0 }); // JUMPDEST
    map.set(0x5c, { pop: 1, push: 1 }); // TLOAD
    map.set(0x5d, { pop: 2, push: 0 }); // TSTORE
    map.set(0x5e, { pop: 3, push: 0 }); // MCOPY
    map.set(0x5f, { pop: 0, push: 1 }); // PUSH0
    // 0x60-0x7f: PUSH1-PUSH32
    for (let i = 0x60; i <= 0x7f; i++) {
        map.set(i, { pop: 0, push: 1 });
    }
    // 0x80-0x8f: DUP1-DUP16
    for (let i = 0x80; i <= 0x8f; i++) {
        const n = i - 0x7f;
        map.set(i, { pop: n, push: n + 1 });
    }
    // 0x90-0x9f: SWAP1-SWAP16
    for (let i = 0x90; i <= 0x9f; i++) {
        const n = i - 0x8f;
        map.set(i, { pop: n + 1, push: n + 1 });
    }
    // 0xa0-0xa4: LOG0-LOG4
    for (let i = 0xa0; i <= 0xa4; i++) {
        const topics = i - 0xa0;
        map.set(i, { pop: 2 + topics, push: 0 });
    }
    // 0xf0: System
    map.set(0xf0, { pop: 3, push: 1 }); // CREATE
    map.set(0xf1, { pop: 7, push: 1 }); // CALL
    map.set(0xf2, { pop: 7, push: 1 }); // CALLCODE
    map.set(0xf3, { pop: 2, push: 0 }); // RETURN
    map.set(0xf4, { pop: 6, push: 1 }); // DELEGATECALL
    map.set(0xf5, { pop: 4, push: 1 }); // CREATE2
    map.set(0xf6, { pop: 1, push: 2 }); // AUTH
    map.set(0xf7, { pop: 7, push: 1 }); // AUTHCALL
    map.set(0xfa, { pop: 6, push: 1 }); // STATICCALL
    map.set(0xfd, { pop: 2, push: 0 }); // REVERT
    map.set(0xfe, { pop: 0, push: 0 }); // INVALID
    map.set(0xff, { pop: 1, push: 0 }); // SELFDESTRUCT
    return map;
}
