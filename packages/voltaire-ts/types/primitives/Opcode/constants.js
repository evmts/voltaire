// @ts-nocheck
/**
 * EVM Opcode Constants
 * @module Opcode/constants
 */
// 0x00s: Stop and Arithmetic Operations
export const STOP = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x00);
export const ADD = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x01);
export const MUL = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x02);
export const SUB = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x03);
export const DIV = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x04);
export const SDIV = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x05);
export const MOD = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x06);
export const SMOD = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x07);
export const ADDMOD = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x08);
export const MULMOD = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x09);
export const EXP = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x0a);
export const SIGNEXTEND = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x0b);
// 0x10s: Comparison & Bitwise Logic Operations
export const LT = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x10);
export const GT = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x11);
export const SLT = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x12);
export const SGT = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x13);
export const EQ = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x14);
export const ISZERO = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x15);
export const AND = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x16);
export const OR = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x17);
export const XOR = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x18);
export const NOT = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x19);
export const BYTE = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x1a);
export const SHL = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x1b);
export const SHR = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x1c);
export const SAR = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x1d);
// 0x20s: Crypto
export const KECCAK256 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x20);
// 0x30s: Environmental Information
export const ADDRESS = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x30);
export const BALANCE = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x31);
export const ORIGIN = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x32);
export const CALLER = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x33);
export const CALLVALUE = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x34);
export const CALLDATALOAD = 
/** @type {import('./OpcodeType.js').OpcodeType} */ (0x35);
export const CALLDATASIZE = 
/** @type {import('./OpcodeType.js').OpcodeType} */ (0x36);
export const CALLDATACOPY = 
/** @type {import('./OpcodeType.js').OpcodeType} */ (0x37);
export const CODESIZE = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x38);
export const CODECOPY = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x39);
export const GASPRICE = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x3a);
export const EXTCODESIZE = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x3b);
export const EXTCODECOPY = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x3c);
export const RETURNDATASIZE = 
/** @type {import('./OpcodeType.js').OpcodeType} */ (0x3d);
export const RETURNDATACOPY = 
/** @type {import('./OpcodeType.js').OpcodeType} */ (0x3e);
export const EXTCODEHASH = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x3f);
// 0x40s: Block Information
export const BLOCKHASH = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x40);
export const COINBASE = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x41);
export const TIMESTAMP = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x42);
export const NUMBER = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x43);
export const DIFFICULTY = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x44);
export const GASLIMIT = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x45);
export const CHAINID = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x46);
export const SELFBALANCE = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x47);
export const BASEFEE = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x48);
export const BLOBHASH = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x49);
export const BLOBBASEFEE = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x4a);
// 0x50s: Stack, Memory, Storage and Flow Operations
export const POP = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x50);
export const MLOAD = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x51);
export const MSTORE = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x52);
export const MSTORE8 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x53);
export const SLOAD = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x54);
export const SSTORE = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x55);
export const JUMP = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x56);
export const JUMPI = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x57);
export const PC = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x58);
export const MSIZE = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x59);
export const GAS = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x5a);
export const JUMPDEST = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x5b);
export const TLOAD = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x5c);
export const TSTORE = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x5d);
export const MCOPY = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x5e);
export const PUSH0 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x5f);
// 0x60-0x7f: PUSH1-PUSH32
export const PUSH1 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x60);
export const PUSH2 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x61);
export const PUSH3 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x62);
export const PUSH4 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x63);
export const PUSH5 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x64);
export const PUSH6 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x65);
export const PUSH7 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x66);
export const PUSH8 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x67);
export const PUSH9 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x68);
export const PUSH10 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x69);
export const PUSH11 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x6a);
export const PUSH12 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x6b);
export const PUSH13 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x6c);
export const PUSH14 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x6d);
export const PUSH15 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x6e);
export const PUSH16 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x6f);
export const PUSH17 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x70);
export const PUSH18 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x71);
export const PUSH19 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x72);
export const PUSH20 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x73);
export const PUSH21 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x74);
export const PUSH22 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x75);
export const PUSH23 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x76);
export const PUSH24 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x77);
export const PUSH25 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x78);
export const PUSH26 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x79);
export const PUSH27 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x7a);
export const PUSH28 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x7b);
export const PUSH29 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x7c);
export const PUSH30 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x7d);
export const PUSH31 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x7e);
export const PUSH32 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x7f);
// 0x80-0x8f: DUP1-DUP16
export const DUP1 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x80);
export const DUP2 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x81);
export const DUP3 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x82);
export const DUP4 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x83);
export const DUP5 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x84);
export const DUP6 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x85);
export const DUP7 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x86);
export const DUP8 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x87);
export const DUP9 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x88);
export const DUP10 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x89);
export const DUP11 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x8a);
export const DUP12 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x8b);
export const DUP13 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x8c);
export const DUP14 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x8d);
export const DUP15 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x8e);
export const DUP16 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x8f);
// 0x90-0x9f: SWAP1-SWAP16
export const SWAP1 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x90);
export const SWAP2 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x91);
export const SWAP3 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x92);
export const SWAP4 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x93);
export const SWAP5 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x94);
export const SWAP6 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x95);
export const SWAP7 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x96);
export const SWAP8 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x97);
export const SWAP9 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x98);
export const SWAP10 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x99);
export const SWAP11 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x9a);
export const SWAP12 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x9b);
export const SWAP13 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x9c);
export const SWAP14 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x9d);
export const SWAP15 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x9e);
export const SWAP16 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0x9f);
// 0xa0-0xa4: LOG0-LOG4
export const LOG0 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0xa0);
export const LOG1 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0xa1);
export const LOG2 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0xa2);
export const LOG3 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0xa3);
export const LOG4 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0xa4);
// 0xf0s: System Operations
export const CREATE = /** @type {import('./OpcodeType.js').OpcodeType} */ (0xf0);
export const CALL = /** @type {import('./OpcodeType.js').OpcodeType} */ (0xf1);
export const CALLCODE = /** @type {import('./OpcodeType.js').OpcodeType} */ (0xf2);
export const RETURN = /** @type {import('./OpcodeType.js').OpcodeType} */ (0xf3);
export const DELEGATECALL = 
/** @type {import('./OpcodeType.js').OpcodeType} */ (0xf4);
export const CREATE2 = /** @type {import('./OpcodeType.js').OpcodeType} */ (0xf5);
export const AUTH = /** @type {import('./OpcodeType.js').OpcodeType} */ (0xf6);
export const AUTHCALL = /** @type {import('./OpcodeType.js').OpcodeType} */ (0xf7);
export const STATICCALL = /** @type {import('./OpcodeType.js').OpcodeType} */ (0xfa);
export const REVERT = /** @type {import('./OpcodeType.js').OpcodeType} */ (0xfd);
export const INVALID = /** @type {import('./OpcodeType.js').OpcodeType} */ (0xfe);
export const SELFDESTRUCT = 
/** @type {import('./OpcodeType.js').OpcodeType} */ (0xff);
