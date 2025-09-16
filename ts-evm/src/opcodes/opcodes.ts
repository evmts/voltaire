// Opcode constants
export const OPCODES = {
  // System
  STOP: 0x00,
  
  // Arithmetic
  ADD: 0x01,
  MUL: 0x02,
  SUB: 0x03,
  DIV: 0x04,
  SDIV: 0x05,
  MOD: 0x06,
  SMOD: 0x07,
  ADDMOD: 0x08,
  MULMOD: 0x09,
  EXP: 0x0a,
  SIGNEXTEND: 0x0b,
  
  // Comparison
  LT: 0x10,
  GT: 0x11,
  SLT: 0x12,
  SGT: 0x13,
  EQ: 0x14,
  ISZERO: 0x15,
  
  // Crypto
  KECCAK256: 0x20,
  
  // Bitwise
  AND: 0x16,
  OR: 0x17,
  XOR: 0x18,
  NOT: 0x19,
  BYTE: 0x1a,
  SHL: 0x1b,
  SHR: 0x1c,
  SAR: 0x1d,
  
  // Context
  ADDRESS: 0x30,
  BALANCE: 0x31,
  ORIGIN: 0x32,
  CALLER: 0x33,
  CALLVALUE: 0x34,
  CALLDATALOAD: 0x35,
  CALLDATASIZE: 0x36,
  CALLDATACOPY: 0x37,
  CODESIZE: 0x38,
  CODECOPY: 0x39,
  GASPRICE: 0x3a,
  EXTCODESIZE: 0x3b,
  EXTCODECOPY: 0x3c,
  RETURNDATASIZE: 0x3d,
  RETURNDATACOPY: 0x3e,
  EXTCODEHASH: 0x3f,
  BLOCKHASH: 0x40,
  COINBASE: 0x41,
  TIMESTAMP: 0x42,
  NUMBER: 0x43,
  DIFFICULTY: 0x44,
  GASLIMIT: 0x45,
  CHAINID: 0x46,
  SELFBALANCE: 0x47,
  BASEFEE: 0x48,
  BLOBHASH: 0x49,
  BLOBBASEFEE: 0x4a,
  
  // Stack
  POP: 0x50,
  
  // Memory
  MLOAD: 0x51,
  MSTORE: 0x52,
  MSTORE8: 0x53,
  
  // Storage
  SLOAD: 0x54,
  SSTORE: 0x55,
  
  MSIZE: 0x59,
  
  // Jump
  JUMP: 0x56,
  JUMPI: 0x57,
  JUMPDEST: 0x5b,
  
  // PC/GAS
  PC: 0x58,
  GAS: 0x5a,
  
  // PUSH0 (EIP-3855)
  PUSH0: 0x5f,
  
  // MCOPY (EIP-5656)
  MCOPY: 0x5e,
  
  // Logs
  LOG0: 0xa0,
  LOG1: 0xa1,
  LOG2: 0xa2,
  LOG3: 0xa3,
  LOG4: 0xa4,
  
  // System
  RETURN: 0xf3,
  INVALID: 0xfe,
} as const;

// PUSH opcodes (0x60 - 0x7f)
export function isPush(opcode: number): boolean {
  return opcode >= 0x60 && opcode <= 0x7f;
}

export function getPushSize(opcode: number): number {
  return opcode - 0x5f; // PUSH1 = 0x60 => 1 byte
}

// DUP opcodes (0x80 - 0x8f)
export function isDup(opcode: number): boolean {
  return opcode >= 0x80 && opcode <= 0x8f;
}

export function getDupN(opcode: number): number {
  return opcode - 0x7f; // DUP1 = 0x80 => dup 1st
}

// SWAP opcodes (0x90 - 0x9f)
export function isSwap(opcode: number): boolean {
  return opcode >= 0x90 && opcode <= 0x9f;
}

export function getSwapN(opcode: number): number {
  return opcode - 0x8f; // SWAP1 = 0x90 => swap with 1st
}