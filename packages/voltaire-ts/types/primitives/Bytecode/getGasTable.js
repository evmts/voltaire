/**
 * Gas cost lookup table for EVM opcodes
 * @returns {Map<number, number>}
 */
export function getGasTable() {
    const map = new Map();
    // 0x00: Stop and Arithmetic
    map.set(0x00, 0); // STOP
    map.set(0x01, 3); // ADD
    map.set(0x02, 5); // MUL
    map.set(0x03, 3); // SUB
    map.set(0x04, 5); // DIV
    map.set(0x05, 5); // SDIV
    map.set(0x06, 5); // MOD
    map.set(0x07, 5); // SMOD
    map.set(0x08, 8); // ADDMOD
    map.set(0x09, 8); // MULMOD
    map.set(0x0a, 10); // EXP
    map.set(0x0b, 5); // SIGNEXTEND
    // 0x10: Comparison & Bitwise
    map.set(0x10, 3); // LT
    map.set(0x11, 3); // GT
    map.set(0x12, 3); // SLT
    map.set(0x13, 3); // SGT
    map.set(0x14, 3); // EQ
    map.set(0x15, 3); // ISZERO
    map.set(0x16, 3); // AND
    map.set(0x17, 3); // OR
    map.set(0x18, 3); // XOR
    map.set(0x19, 3); // NOT
    map.set(0x1a, 3); // BYTE
    map.set(0x1b, 3); // SHL
    map.set(0x1c, 3); // SHR
    map.set(0x1d, 3); // SAR
    // 0x20: SHA3
    map.set(0x20, 30); // KECCAK256
    // 0x30: Environmental Information
    map.set(0x30, 2); // ADDRESS
    map.set(0x31, 100); // BALANCE
    map.set(0x32, 2); // ORIGIN
    map.set(0x33, 2); // CALLER
    map.set(0x34, 2); // CALLVALUE
    map.set(0x35, 3); // CALLDATALOAD
    map.set(0x36, 2); // CALLDATASIZE
    map.set(0x37, 3); // CALLDATACOPY
    map.set(0x38, 2); // CODESIZE
    map.set(0x39, 3); // CODECOPY
    map.set(0x3a, 2); // GASPRICE
    map.set(0x3b, 100); // EXTCODESIZE
    map.set(0x3c, 100); // EXTCODECOPY
    map.set(0x3d, 2); // RETURNDATASIZE
    map.set(0x3e, 3); // RETURNDATACOPY
    map.set(0x3f, 100); // EXTCODEHASH
    // 0x40: Block Information
    map.set(0x40, 20); // BLOCKHASH
    map.set(0x41, 2); // COINBASE
    map.set(0x42, 2); // TIMESTAMP
    map.set(0x43, 2); // NUMBER
    map.set(0x44, 2); // DIFFICULTY/PREVRANDAO
    map.set(0x45, 2); // GASLIMIT
    map.set(0x46, 2); // CHAINID
    map.set(0x47, 5); // SELFBALANCE
    map.set(0x48, 2); // BASEFEE
    map.set(0x49, 3); // BLOBHASH
    map.set(0x4a, 2); // BLOBBASEFEE
    // 0x50: Stack, Memory, Storage and Flow
    map.set(0x50, 2); // POP
    map.set(0x51, 3); // MLOAD
    map.set(0x52, 3); // MSTORE
    map.set(0x53, 3); // MSTORE8
    map.set(0x54, 100); // SLOAD
    map.set(0x55, 100); // SSTORE
    map.set(0x56, 8); // JUMP
    map.set(0x57, 10); // JUMPI
    map.set(0x58, 2); // PC
    map.set(0x59, 2); // MSIZE
    map.set(0x5a, 2); // GAS
    map.set(0x5b, 1); // JUMPDEST
    map.set(0x5c, 100); // TLOAD
    map.set(0x5d, 100); // TSTORE
    map.set(0x5e, 3); // MCOPY
    map.set(0x5f, 2); // PUSH0
    // 0x60-0x7f: PUSH1-PUSH32
    for (let i = 0x60; i <= 0x7f; i++) {
        map.set(i, 3);
    }
    // 0x80-0x8f: DUP1-DUP16
    for (let i = 0x80; i <= 0x8f; i++) {
        map.set(i, 3);
    }
    // 0x90-0x9f: SWAP1-SWAP16
    for (let i = 0x90; i <= 0x9f; i++) {
        map.set(i, 3);
    }
    // 0xa0-0xa4: LOG0-LOG4
    map.set(0xa0, 375); // LOG0
    map.set(0xa1, 750); // LOG1
    map.set(0xa2, 1125); // LOG2
    map.set(0xa3, 1500); // LOG3
    map.set(0xa4, 1875); // LOG4
    // 0xf0: System
    map.set(0xf0, 32000); // CREATE
    map.set(0xf1, 100); // CALL
    map.set(0xf2, 100); // CALLCODE
    map.set(0xf3, 0); // RETURN
    map.set(0xf4, 100); // DELEGATECALL
    map.set(0xf5, 32000); // CREATE2
    map.set(0xf6, 3); // AUTH
    map.set(0xf7, 100); // AUTHCALL
    map.set(0xfa, 100); // STATICCALL
    map.set(0xfd, 0); // REVERT
    map.set(0xfe, 0); // INVALID
    map.set(0xff, 5000); // SELFDESTRUCT
    return map;
}
